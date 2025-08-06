from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field, EmailStr


class Product(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    name: str

    price: float
    image_url: List[str]


class AdminUser(BaseModel):
    uid: str
    email: EmailStr


class OrderItem(BaseModel):
    product_id: str
    quantity: int


class Order(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    items: List[OrderItem]
    email: EmailStr
    first_name: str
    last_name: str
    address: str
    city: str
    state: str
    pincode: str
    phone_number: str
    status: str
    total_price: float
    created_at: Optional[datetime] = None
    message: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: str
