from sqlalchemy import Column, Integer, String, Numeric, DateTime, Text
from sqlalchemy.sql import func
from ..core.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    price = Column(Numeric(10, 2), nullable=False)
    image = Column(String(255), nullable=True)
    file_type = Column(String(20), nullable=True)  # e.g., .psd, .fig, .ai
    tags = Column(Text, nullable=True)  # comma-separated tags
    programs = Column(Text, nullable=True)  # comma-separated programs (e.g., Figma, Photoshop)
    rating = Column(Numeric(2, 1), nullable=True)
    sales = Column(Integer, default=0)
    status = Column(String(20), default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
