from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.auth import oauth2_scheme, decode_token
from ..models.order import Order
from ..models.order_item import OrderItem
from ..models.product import Product
from ..models.cart_item import CartItem
from ..schemas.order import OrderCreate, OrderOut


router = APIRouter()


def require_user(token: str = Depends(oauth2_scheme)) -> int:
    payload = decode_token(token)
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return int(sub)


@router.get("", response_model=List[OrderOut])
def list_orders(user_id: int = Depends(require_user), db: Session = Depends(get_db)):
    orders = db.query(Order).filter(Order.user_id == user_id).all()
    # attach items
    for o in orders:
        _ = db.query(OrderItem).filter(OrderItem.order_id == o.id).all()
    return orders


@router.post("", response_model=OrderOut, status_code=201)
def create_order(payload: OrderCreate, user_id: int = Depends(require_user), db: Session = Depends(get_db)):
    subtotal = 0.0
    items_models: List[OrderItem] = []
    for it in payload.items:
        product = db.query(Product).filter(Product.id == it.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {it.product_id} not found")
        price = float(product.price)
        subtotal += price * it.quantity
        items_models.append(OrderItem(product_id=product.id, quantity=it.quantity, price=price))
    discount = payload.discount
    tax = payload.tax
    total = subtotal - discount + tax

    order = Order(user_id=user_id, subtotal=subtotal, discount=discount, tax=tax, total=total, status="paid")
    db.add(order)
    db.commit()
    db.refresh(order)

    for im in items_models:
        im.order_id = order.id
        db.add(im)
    db.commit()
    # Clear user's cart after successful order
    db.query(CartItem).filter(CartItem.user_id == user_id).delete()
    db.refresh(order)
    return order
