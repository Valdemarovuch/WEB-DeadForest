from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class PromoCodeCreate(BaseModel):
    code: str = Field(..., min_length=3, max_length=64)
    discount: float = Field(..., ge=0)
    max_uses: Optional[int] = Field(default=None, ge=1)
    expires_at: Optional[datetime] = None
    is_active: bool = True


class PromoCodeOut(BaseModel):
    id: int
    code: str
    discount: float
    max_uses: Optional[int]
    uses: int
    expires_at: Optional[datetime]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
