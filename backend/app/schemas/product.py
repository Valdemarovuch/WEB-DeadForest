from pydantic import BaseModel
from pydantic import ConfigDict
from typing import Optional
from datetime import datetime


class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    price: float
    image: Optional[str] = None
    file_type: Optional[str] = None
    tags: Optional[str] = None
    programs: Optional[str] = None
    rating: Optional[float] = None
    sales: Optional[int] = 0
    status: Optional[str] = "active"


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    image: Optional[str] = None
    file_type: Optional[str] = None
    tags: Optional[str] = None
    programs: Optional[str] = None
    rating: Optional[float] = None
    sales: Optional[int] = None
    status: Optional[str] = None


class ProductOut(ProductBase):
    id: int
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)
