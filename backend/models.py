from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    client_name = Column(String, index=True)
    source = Column(String, default="WhatsApp") # e.g. WhatsApp, Web, Email
    grand_total = Column(Float, default=0.0)
    status = Column(String, default="Pending")
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    raw_text = Column(Text, nullable=True)

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    item_name = Column(String, index=True)
    quantity = Column(Integer, default=1)
    
    order = relationship("Order", back_populates="items")

# Pydantic Schemas
class OrderCreate(BaseModel):
    raw_text: str

class OrderItemResponse(BaseModel):
    id: int
    item_name: str
    quantity: int
    
    model_config = ConfigDict(from_attributes=True)

class OrderResponse(BaseModel):
    id: int
    client_name: str
    source: str
    grand_total: float
    status: str
    timestamp: datetime
    raw_text: Optional[str] = None
    items: List[OrderItemResponse] = []

    model_config = ConfigDict(from_attributes=True)
