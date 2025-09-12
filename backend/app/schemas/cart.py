from pydantic import BaseModel
from pydantic import ConfigDict
from typing import List, Optional


class ProductMini(BaseModel):
    id: int
    name: str
    category: Optional[str] = None
    price: float
    image: Optional[str] = None


class CartItemBase(BaseModel):
    product_id: int
    quantity: int


class CartItemCreate(CartItemBase):
    pass


class CartItemUpdate(BaseModel):
    quantity: int


class CartItemOut(CartItemBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class CartResponse(BaseModel):
    items: List[CartItemOut]
    subtotal: float
    total: float


class CartItemWithProduct(BaseModel):
    id: int
    product: ProductMini
    quantity: int


class CartResponseExpanded(BaseModel):
    items: List[CartItemWithProduct]
    subtotal: float
    total: float
