from sqlalchemy import Column, String, Float, Integer, DateTime, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base
import enum
import uuid
from datetime import datetime

# Define a Python enum for the invoice status
class InvoiceStatusEnum(str, enum.Enum):
    PAID = "PAID"
    UNPAID = "UNPAID"
    OVERDUE = "OVERDUE"
    
def generate_uuid():
    return str(uuid.uuid4())

class Client(Base):
    __tablename__ = "clients"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    address = Column(String, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    
    invoices = relationship("Invoice", back_populates="client", cascade="all, delete-orphan")

class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(String, primary_key=True, default=generate_uuid)
    invoiceNumber = Column(String, unique=True, index=True)
    issueDate = Column(DateTime, nullable=False)
    dueDate = Column(DateTime, nullable=False)
    status = Column(SQLEnum(InvoiceStatusEnum), default=InvoiceStatusEnum.UNPAID, nullable=False)
    total = Column(Float, nullable=False)
    
    clientId = Column(String, ForeignKey("clients.id"), nullable=False)
    client = relationship("Client", back_populates="invoices")

    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan") 
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan") 

class InvoiceItem(Base):
    __tablename__ = "invoice_items"
    id = Column(String, primary_key=True, default=generate_uuid)
    itemName = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    unitPrice = Column(Float, nullable=False)
    
    invoiceId = Column(String, ForeignKey("invoices.id"), nullable=False)
    invoice = relationship("Invoice", back_populates="items")

class Payment(Base):
    __tablename__ = "payments"
    id = Column(String, primary_key=True, default=generate_uuid)
    amount = Column(Float, nullable=False)
    paymentDate = Column(DateTime, default=datetime.utcnow)
    method = Column(String, default="Card")
    
    invoiceId = Column(String, ForeignKey("invoices.id"), nullable=False)
    invoice = relationship("Invoice", back_populates="payments")
    
class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String, primary_key=True, default=generate_uuid)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id = Column(String, nullable=False)
    action = Column(String, nullable=False) 
    details = Column(String, nullable=True) 