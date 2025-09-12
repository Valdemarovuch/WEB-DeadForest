from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.product import Product
from ..schemas.product import ProductOut, ProductCreate, ProductUpdate
from ..core.auth import oauth2_scheme, decode_token
from ..models.user import User


router = APIRouter()


def require_user(token: str = Depends(oauth2_scheme)) -> int:
    payload = decode_token(token)
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return int(sub)

def require_admin(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> int:
    payload = decode_token(token)
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user_id = int(sub)
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not bool(user.is_admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user_id


@router.get("", response_model=List[ProductOut])
def list_products(
    q: Optional[str] = None,
    categories: Optional[List[str]] = Query(None),
    tags: Optional[List[str]] = Query(None),
    programs: Optional[List[str]] = Query(None),
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
    max_rating: Optional[float] = None,
    sort: Optional[str] = None,
    db: Session = Depends(get_db),
):
    # Public listing: only active products are visible in the store
    from sqlalchemy import or_
    query = db.query(Product).filter(or_(Product.status == "active", Product.status.is_(None)))
    if q:
        like = f"%{q}%"
        query = query.filter(
            (Product.name.ilike(like))
            | (Product.category.ilike(like))
            | (Product.description.ilike(like))
        )
    if categories:
        query = query.filter(Product.category.in_(categories))
    if tags:
        # match any tag in comma-separated tags field
        clauses = []
        for t in tags:
            like = f"%{t}%"
            clauses.append(Product.tags.ilike(like))
        if clauses:
            from sqlalchemy import or_
            query = query.filter(or_(*clauses))
    if programs:
        clauses = []
        for p in programs:
            like = f"%{p}%"
            clauses.append(Product.programs.ilike(like))
        if clauses:
            from sqlalchemy import or_
            query = query.filter(or_(*clauses))
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    if min_rating is not None:
        query = query.filter(Product.rating >= min_rating)
    if max_rating is not None:
        query = query.filter(Product.rating <= max_rating)
    if sort == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort == "price_desc":
        query = query.order_by(Product.price.desc())
    else:
        query = query.order_by(Product.created_at.desc())
    return query.all()


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("", response_model=ProductOut, status_code=201)
def create_product(payload: ProductCreate, _: int = Depends(require_admin), db: Session = Depends(get_db)):
    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, payload: ProductUpdate, _: int = Depends(require_admin), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=204)
def delete_product(product_id: int, _: int = Depends(require_admin), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return None
