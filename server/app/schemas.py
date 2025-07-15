from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from .models import InvoiceStatusEnum

# --- Base and Create Schemas (for input) ---

class InvoiceItemCreate(BaseModel):
    itemName: str
    quantity: int
    unitPrice: float

class ClientCreate(BaseModel):
    name: str
    email: EmailStr
    address: str

class InvoiceCreate(BaseModel):
    clientId: str
    issueDate: datetime
    dueDate: datetime
    items: List[InvoiceItemCreate]

class InvoiceStatusUpdate(BaseModel):
    status: InvoiceStatusEnum

# --- Full Schemas (for output) ---

class InvoiceItem(InvoiceItemCreate):
    id: str
    class Config:
        from_attributes = True

class Client(ClientCreate):
    id: str
    createdAt: datetime
    class Config:
        from_attributes = True

# Response model for getting an Invoice, includes nested client info
class InvoiceClientInfo(BaseModel):
    name: str
    class Config:
        from_attributes = True
        
class Invoice(BaseModel):
    id: str
    invoiceNumber: str
    issueDate: datetime
    dueDate: datetime
    status: InvoiceStatusEnum
    total: float
    client: InvoiceClientInfo  # Use a simpler client schema for the list view
    
    class Config:
        from_attributes = True

# Response model for a single, detailed invoice
class InvoiceDetails(Invoice):
    items: List[InvoiceItem] # Include items only for the detail view

class DashboardMetrics(BaseModel):
    totalRevenue: float
    totalOutstanding: float
    totalInvoices: int
    overdueCount: int
    
class EmailRequest(BaseModel):
    recipient_email: str
    subject: str
    body: str
    
class PaymentCreate(BaseModel):
    amount: float
    method: Optional[str] = "Card"

class Payment(PaymentCreate):
    id: str
    paymentDate: datetime

    class Config:
        from_attributes = True

class EmailRequest(BaseModel):
    recipient_email: str
    subject: str
    body: str

class InvoiceDetails(Invoice):
    items: List[InvoiceItem]
    payments: List[Payment] = []
    
class AuditLog(BaseModel):
    id: str
    timestamp: datetime
    entity_type: str
    entity_id: str
    action: str
    details: Optional[str] = None

    class Config:
        from_attributes = True 

