from fastapi import FastAPI, Depends, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
import json
import openai
from pydantic import BaseModel, ValidationError
import os
from sqlalchemy import func
from fastapi.responses import StreamingResponse
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from pathlib import Path
from dotenv import load_dotenv
import csv

from . import models, schemas, database
from .audit_utils import log_activity
env_path = Path('.') / '.env'
load_dotenv(dotenv_path=env_path)

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Invoicing API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    # Use the CORRECT variable name here
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY not found in .env file.")
    
    # This is the correct way to initialize the client in the new openai library version
    client = openai.OpenAI(api_key=api_key)
    print("OpenAI client initialized successfully.") # Good for debugging
    
except Exception as e:
    print(f"Warning: Could not initialize OpenAI client - {e}. AI features will be disabled.")
    client = None
    
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Welcome to the Invoicing API"}

@app.post("/api/clients", response_model=schemas.Client, status_code=201)
def create_client(client: schemas.ClientCreate, db: Session = Depends(get_db)):
    db_client = models.Client(**client.model_dump())
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client

@app.get("/api/clients", response_model=List[schemas.Client])
def get_clients(db: Session = Depends(get_db)):
    return db.query(models.Client).order_by(models.Client.name).all()

@app.delete("/api/clients/{client_id}", status_code=204)
def delete_client(client_id: str, db: Session = Depends(get_db)):
    client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    db.delete(client)
    db.commit()
    return

@app.put("/api/clients/{client_id}", response_model=schemas.Client)
def update_client(client_id: str, client_data: schemas.ClientCreate, db: Session = Depends(get_db)):
    db_client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Update the client's data
    db_client.name = client_data.name
    db_client.email = client_data.email
    db_client.address = client_data.address
    
    log_activity(db, 'Client', db_client.id, 'UPDATE', f"Client '{db_client.name}' details updated.")
    
    db.commit()
    db.refresh(db_client)
    return db_client

@app.post("/api/invoices", response_model=schemas.InvoiceDetails, status_code=201)
def create_invoice(invoice: schemas.InvoiceCreate, db: Session = Depends(get_db)):
    client = db.query(models.Client).filter(models.Client.id == invoice.clientId).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    total = sum(item.quantity * item.unitPrice for item in invoice.items)
    last_invoice_count = db.query(models.Invoice).count()
    invoice_number = f"INV-{last_invoice_count + 1001}"

    db_invoice = models.Invoice(
        invoiceNumber=invoice_number,
        total=total,
        clientId=invoice.clientId,
        issueDate=invoice.issueDate,
        dueDate=invoice.dueDate,
        items=[models.InvoiceItem(**item.model_dump()) for item in invoice.items]
    )
    
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

@app.get("/api/invoices", response_model=List[schemas.Invoice])
def get_invoices(status: Optional[models.InvoiceStatusEnum] = None, db: Session = Depends(get_db)):
    query = db.query(models.Invoice).options(joinedload(models.Invoice.client))
    
    if status:
        query = query.filter(models.Invoice.status == status)

    invoices = query.order_by(models.Invoice.issueDate.desc()).all()

    for inv in invoices:
        if inv.status == models.InvoiceStatusEnum.UNPAID and inv.dueDate < datetime.utcnow():
            inv.status = models.InvoiceStatusEnum.OVERDUE
            
    return invoices

@app.put("/api/invoices/{invoice_id}/status", response_model=schemas.Invoice)
def update_invoice_status(invoice_id: str, status_update: schemas.InvoiceStatusUpdate, db: Session = Depends(get_db)):
    db_invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not db_invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    db_invoice.status = status_update.status
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

class AIQueryRequest(BaseModel):
    query: str

@app.get("/api/metrics", response_model=schemas.DashboardMetrics)
def get_dashboard_metrics(db: Session = Depends(get_db)):
    # Calculate Total Revenue (from PAID invoices)
    total_revenue = db.query(func.sum(models.Invoice.total)).filter(
        models.Invoice.status == 'PAID'
    ).scalar() or 0.0

    # Calculate Total Outstanding (from UNPAID and OVERDUE)
    # Note: We must first update statuses to catch new overdues
    all_unpaid_invoices = db.query(models.Invoice).filter(models.Invoice.status != 'PAID').all()
    overdue_count = 0
    total_outstanding = 0
    for inv in all_unpaid_invoices:
        is_overdue = inv.status == 'UNPAID' and inv.dueDate < datetime.utcnow()
        if is_overdue:
            overdue_count += 1
        total_outstanding += inv.total

    total_invoices = db.query(models.Invoice).count()

    return {
        "totalRevenue": total_revenue,
        "totalOutstanding": total_outstanding,
        "totalInvoices": total_invoices,
        "overdueCount": overdue_count
    }

@app.post("/api/ai/query")
async def handle_ai_query(request: AIQueryRequest, db: Session = Depends(get_db)):
    if not openai.api_key:
        raise HTTPException(status_code=503, detail="OpenAI API key not configured on the server.")

    clients_data = db.query(models.Client).options(
        joinedload(models.Client.invoices).joinedload(models.Invoice.items)
    ).all()

    simplified_data = []
    for client in clients_data:
        client_info = {
            "client_name": client.name,
            "invoices": [
                {
                    "invoice_number": inv.invoiceNumber,
                    "status": inv.status.value, # Use .value to get the string from the enum
                    "issue_date": inv.issueDate.isoformat(),
                    "due_date": inv.dueDate.isoformat(),
                    "total_amount": inv.total,
                    "items": [
                        {"name": item.itemName, "quantity": item.quantity, "price": item.unitPrice}
                        for item in inv.items
                    ],
                }
                for inv in client.invoices
            ],
        }
        simplified_data.append(client_info)
    
    system_prompt = """
    You are an expert business analyst AI for an invoicing application. Your task is to answer questions based on the provided data. 
    Be concise, professional, and provide actionable insights in Markdown format.
    Today's date is {current_date}. Use this to determine if payments are late.
    Analyze the data to answer the user's question.
    """.format(current_date=datetime.now().date().isoformat())

    user_query = f"""
    Here is the complete business data in JSON format:
    ```json
    {json.dumps(simplified_data, indent=2)}
    ```

    Based on the data above, please answer the following question: "{request.query}"
    """

    try:
        completion = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_query},
            ]
        )
        ai_response = completion.choices[0].message.content
        return {"answer": ai_response}
    except Exception as e:
        print(f"Error calling OpenAI: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while communicating with the AI.")

@app.get("/api/invoices/{invoice_id}/pdf")
def generate_invoice_pdf(invoice_id: str, db: Session = Depends(get_db)):
    # Fetch the invoice with all its details
    invoice = db.query(models.Invoice).options(
        joinedload(models.Invoice.client),
        joinedload(models.Invoice.items)
    ).filter(models.Invoice.id == invoice_id).first()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    # Create a file-like buffer to receive PDF data.
    buffer = io.BytesIO()

    # Create the PDF object, using the buffer as its "file."
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    # --- Start Drawing the PDF ---
    p.setFont("Helvetica-Bold", 16)
    p.drawString(inch, height - inch, f"Invoice: {invoice.invoiceNumber}")

    p.setFont("Helvetica", 12)
    p.drawString(inch, height - 1.25 * inch, f"Status: {invoice.status.value}")

    # Client Info
    p.setFont("Helvetica-Bold", 12)
    p.drawString(inch, height - 2 * inch, "Bill To:")
    p.setFont("Helvetica", 12)
    p.drawString(inch, height - 2.25 * inch, invoice.client.name)
    p.drawString(inch, height - 2.5 * inch, invoice.client.address)
    p.drawString(inch, height - 2.75 * inch, invoice.client.email)

    # Dates
    p.setFont("Helvetica-Bold", 12)
    p.drawString(width - 3 * inch, height - 2 * inch, "Issue Date:")
    p.drawString(width - 3 * inch, height - 2.25 * inch, "Due Date:")
    p.setFont("Helvetica", 12)
    p.drawString(width - 2 * inch, height - 2 * inch, invoice.issueDate.strftime("%Y-%m-%d"))
    p.drawString(width - 2 * inch, height - 2.25 * inch, invoice.dueDate.strftime("%Y-%m-%d"))

    # Line Items Table
    p.setFont("Helvetica-Bold", 12)
    y_position = height - 4 * inch
    p.drawString(inch, y_position, "Item")
    p.drawString(width - 3 * inch, y_position, "Quantity")
    p.drawString(width - 2 * inch, y_position, "Unit Price")
    p.drawString(width - 1 * inch, y_position, "Total")
    p.line(inch, y_position - 0.1 * inch, width - inch, y_position - 0.1 * inch)

    p.setFont("Helvetica", 12)
    y_position -= 0.3 * inch
    for item in invoice.items:
        p.drawString(inch, y_position, item.itemName)
        p.drawString(width - 3 * inch, y_position, str(item.quantity))
        p.drawString(width - 2 * inch, y_position, f"${item.unitPrice:.2f}")
        p.drawString(width - 1 * inch, y_position, f"${item.quantity * item.unitPrice:.2f}")
        y_position -= 0.25 * inch

    # Total
    p.setFont("Helvetica-Bold", 14)
    p.drawString(width - 3 * inch, y_position - 0.5 * inch, "Grand Total:")
    p.drawString(width - 1.5 * inch, y_position - 0.5 * inch, f"${invoice.total:.2f}")

    # --- Finish Drawing ---
    p.showPage()
    p.save()

    # File-like buffer is now ready, "rewind" it to the beginning
    buffer.seek(0)
    
    headers = {'Content-Disposition': f'inline; filename="invoice_{invoice.invoiceNumber}.pdf"'}
    return StreamingResponse(buffer, headers=headers, media_type='application/pdf')

@app.post("/api/mock-email/send")
def send_mock_email(email_data: schemas.EmailRequest, db: Session = Depends(get_db)): # <-- Use schemas.EmailRequest
    print("--- MOCK EMAIL ---")
    print(f"Recipient: {email_data.recipient_email}")
    print(f"Subject: {email_data.subject}")
    print("--- Body ---")
    print(email_data.body)
    print("--- EMAIL SENT (MOCK) ---")
    return {"message": "Email sent successfully (mocked). Check server console."}

@app.get("/api/invoices/{invoice_id}", response_model=schemas.InvoiceDetails)
def get_invoice_details(invoice_id: str, db: Session = Depends(get_db)):
    invoice = db.query(models.Invoice).options(
        joinedload(models.Invoice.client),
        joinedload(models.Invoice.items),
        joinedload(models.Invoice.payments) # <-- Eagerly load payments
    ).filter(models.Invoice.id == invoice_id).first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    return invoice

@app.post("/api/invoices/{invoice_id}/payments", response_model=schemas.InvoiceDetails)
def record_payment(invoice_id: str, payment: schemas.PaymentCreate, db: Session = Depends(get_db)):
    # Use a transaction to ensure data integrity
    with db.begin_nested():
        invoice = db.query(models.Invoice).with_for_update().options(
            joinedload(models.Invoice.payments)
        ).filter(models.Invoice.id == invoice_id).first()
        
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")

        # Create new payment record
        db_payment = models.Payment(invoiceId=invoice_id, amount=payment.amount, method=payment.method)
        db.add(db_payment)
        
        # Recalculate status based on all payments
        total_paid = sum(p.amount for p in invoice.payments) + payment.amount
        
        if total_paid >= invoice.total:
            invoice.status = models.InvoiceStatusEnum.PAID
        else:
            # If partially paid, ensure it's not marked as PAID
            invoice.status = models.InvoiceStatusEnum.UNPAID
        
        db.commit()
    
    return get_invoice_details(invoice_id, db)

@app.get("/api/export/invoices/csv")
def export_invoices_to_csv(db: Session = Depends(get_db)):
    try:
        invoices_to_export = db.query(models.Invoice).options(
            joinedload(models.Invoice.client)
        ).order_by(models.Invoice.issueDate.desc()).all()
    except Exception as e:
        print(f"Database error during CSV export: {e}")
        raise HTTPException(status_code=500, detail="Could not fetch invoice data from the database.")

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(['Invoice #', 'Client Name', 'Status', 'Issue Date', 'Due Date', 'Total Amount'])

    for inv in invoices_to_export:
        current_status = inv.status.value
        if inv.status == models.InvoiceStatusEnum.UNPAID and inv.dueDate < datetime.utcnow():
            current_status = models.InvoiceStatusEnum.OVERDUE.value

        writer.writerow([
            inv.invoiceNumber,
            inv.client.name,
            current_status,
            inv.issueDate.strftime('%Y-%m-%d'),
            inv.dueDate.strftime('%Y-%m-%d'),
            inv.total
        ])
    output.seek(0)
    
    headers = {
        'Content-Disposition': 'attachment; filename="invoices_export.csv"'
    }
    return StreamingResponse(output, headers=headers, media_type='text/csv')

@app.post("/api/invoices/{invoice_id}/payments", response_model=schemas.InvoiceDetails)
def record_payment(invoice_id: str, payment: schemas.PaymentCreate, db: Session = Depends(get_db)):
    invoice = db.query(models.Invoice).with_for_update().options(
        joinedload(models.Invoice.payments)
    ).filter(models.Invoice.id == invoice_id).first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    total_paid_before = sum(p.amount for p in invoice.payments)
    if payment.amount > (invoice.total - total_paid_before + 0.001): # Add tolerance for float issues
        raise HTTPException(status_code=400, detail="Payment amount cannot exceed the balance due.")

    db_payment = models.Payment(
        invoiceId=invoice_id, 
        amount=payment.amount, 
        method=payment.method
    )
    db.add(db_payment)

    total_paid_after = total_paid_before + payment.amount
    if total_paid_after >= invoice.total:
        invoice.status = models.InvoiceStatusEnum.PAID
    else:

        invoice.status = models.InvoiceStatusEnum.UNPAID

    log_activity(
        db, 
        entity_type='Payment', 
        entity_id=invoice.id, 
        action='CREATE', 
        details=f"Payment of ${payment.amount:.2f} recorded for invoice {invoice.invoiceNumber}."
    )

    db.commit()

    db.refresh(invoice)

    return get_invoice_details(invoice_id, db)

@app.get("/api/audit-logs", response_model=List[schemas.AuditLog])
def get_audit_logs(db: Session = Depends(get_db)):
    return db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).limit(100).all()

@app.post("/api/import/clients/csv")
async def import_clients_from_csv(db: Session = Depends(get_db), file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file type.")
    try:
        rows = list(csv.DictReader(io.StringIO((await file.read()).decode('utf-8'))))
    except Exception:
        raise HTTPException(status_code=400, detail="Could not process CSV file.")
    new_clients, errors = [], []
    for i, row in enumerate(rows):
        try:
            client_data = schemas.ClientCreate(**row)
            new_clients.append(models.Client(**client_data.model_dump()))
        except ValidationError as e:
            errors.append(f"Row {i + 2}: {[f'{err['loc'][0]}: {err['msg']}' for err in e.errors()]}")
    if errors:
        raise HTTPException(status_code=422, detail={"message": f"Import failed with {len(errors)} error(s).", "errors": errors})
    db.add_all(new_clients)
    log_activity(db, 'Client', 'Multiple', 'IMPORT', f"Imported {len(new_clients)} clients from CSV.")
    db.commit()
    return {"message": f"Successfully imported {len(new_clients)} clients."}