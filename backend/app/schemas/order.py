from pydantic import BaseModel
from pydantic import ConfigDict
from typing import List


class OrderItemIn(BaseModel):
    product_id: int
    quantity: int


class OrderCreate(BaseModel):
    items: List[OrderItemIn]
    discount: float = 0
    tax: float = 0


class OrderItemOut(BaseModel):
    id: int
    product_id: int | None
    quantity: int
    price: float
    model_config = ConfigDict(from_attributes=True)


class OrderOut(BaseModel):
    id: int
    subtotal: float
    discount: float
    tax: float
    total: float
    status: str
    items: List[OrderItemOut]
    model_config = ConfigDict(from_attributes=True)
