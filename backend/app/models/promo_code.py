from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float
from datetime import datetime
from ..core import Base


class PromoCode(Base):
    __tablename__ = "promo_codes"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(64), unique=True, nullable=False, index=True)
    discount = Column(Float, nullable=False, default=0)  # percent (0-100) or fixed amount later
    max_uses = Column(Integer, nullable=True)  # null => unlimited
    uses = Column(Integer, nullable=False, default=0)
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
