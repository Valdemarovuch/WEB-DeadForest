from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.auth import oauth2_scheme, decode_token
from ..models.cart_item import CartItem
from ..models.product import Product
from ..schemas.cart import CartItemOut, CartItemCreate, CartItemUpdate, CartResponseExpanded, CartItemWithProduct, ProductMini


router = APIRouter()


def require_user(token: str = Depends(oauth2_scheme)) -> int:
    payload = decode_token(token)
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return int(sub)


def compute_totals(items: List[CartItem]) -> tuple[float, float]:
    subtotal = 0.0
    for it in items:
        product = it.product_id and (db_product := None)  # placeholder for type
    return subtotal, subtotal  # no extra fees for now


@router.get("", response_model=CartResponseExpanded)
def get_cart(user_id: int = Depends(require_user), db: Session = Depends(get_db)):
    rows = db.query(CartItem).filter(CartItem.user_id == user_id).all()
    items: list[CartItemWithProduct] = []
    subtotal = 0.0
    for it in rows:
        product = db.query(Product).filter(Product.id == it.product_id).first()
        if product:
            pmini = ProductMini(
                id=product.id,
                name=product.name,
                category=product.category,
                price=float(product.price),
                image=product.image,
            )
            items.append(CartItemWithProduct(id=it.id, product=pmini, quantity=it.quantity))
            subtotal += float(product.price) * it.quantity
    return CartResponseExpanded(items=items, subtotal=subtotal, total=subtotal)


@router.post("", response_model=CartItemOut, status_code=201)
def add_to_cart(payload: CartItemCreate, user_id: int = Depends(require_user), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == payload.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    item = db.query(CartItem).filter(CartItem.user_id == user_id, CartItem.product_id == payload.product_id).first()
    if item:
        item.quantity += payload.quantity
    else:
        item = CartItem(user_id=user_id, product_id=payload.product_id, quantity=payload.quantity)
        db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=CartItemOut)
def update_cart_item(item_id: int, payload: CartItemUpdate, user_id: int = Depends(require_user), db: Session = Depends(get_db)):
    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.user_id == user_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    item.quantity = payload.quantity
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
def remove_cart_item(item_id: int, user_id: int = Depends(require_user), db: Session = Depends(get_db)):
    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.user_id == user_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    db.delete(item)
    db.commit()
    return None
