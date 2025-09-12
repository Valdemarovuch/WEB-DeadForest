from typing import Optional
from fastapi import APIRouter, Depends, status, HTTPException, Body
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.auth import oauth2_scheme, decode_token, get_password_hash
from ..models.order import Order
from ..models.order_item import OrderItem
from ..models.product import Product
from ..models.user import User
from ..models.promo_code import PromoCode
from ..schemas.product import ProductOut


router = APIRouter()


from ..core.logger import audit

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


@router.get("/products", response_model=list[ProductOut])
def admin_products(_user_id: int = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(Product).order_by(Product.created_at.desc()).all()


@router.post("/products/{product_id}/disable")
def admin_disable_product(product_id: int, _user_id: int = Depends(require_admin), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.status = "disabled"
    db.commit()
    audit("product.disable", actor_id=_user_id, product_id=product_id)
    return {"status": "ok"}


@router.post("/products/{product_id}/enable")
def admin_enable_product(product_id: int, _user_id: int = Depends(require_admin), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.status = "active"
    db.commit()
    audit("product.enable", actor_id=_user_id, product_id=product_id)
    return {"status": "ok"}


@router.delete("/products/{product_id}", status_code=204)
def admin_delete_product(product_id: int, _user_id: int = Depends(require_admin), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    # record audit then delete
    audit("product.delete", actor_id=_user_id, product_id=product_id, name=getattr(product, "name", None))
    db.delete(product)
    db.commit()
    return None


@router.get("/stats")
def get_stats(_user_id: int = Depends(require_admin), db: Session = Depends(get_db)):
    # Aggregate totals
    total_orders = db.query(Order).count()
    # Sum of totals; handle None
    from sqlalchemy import func as sa_func
    total_revenue = db.query(sa_func.coalesce(sa_func.sum(Order.total), 0)).scalar() or 0
    active_products = db.query(Product).filter(Product.status != "archived").count()
    return {
        "total_revenue": float(total_revenue),
        "total_orders": int(total_orders),
        "active_products": int(active_products),
        # Placeholder metric; wire to analytics later
        "page_views": 0,
    }


@router.get("/recent-orders")
def recent_orders(_user_id: int = Depends(require_admin), db: Session = Depends(get_db)):
    orders = db.query(Order).order_by(Order.created_at.desc()).limit(8).all()
    results = []
    for o in orders:
        user: Optional[User] = db.query(User).filter(User.id == o.user_id).first() if o.user_id else None
        results.append({
            "id": o.id,
            "customer": user.email if user else "Guest",
            "total": float(o.total or 0),
            "status": o.status,
            "created_at": o.created_at.isoformat() if o.created_at else None,
        })
    return results


@router.get("/top-products")
def top_products(_user_id: int = Depends(require_admin), db: Session = Depends(get_db)):
    products = db.query(Product).order_by(Product.sales.desc()).limit(6).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "sales": int(p.sales or 0),
            "revenue": float((p.sales or 0) * float(p.price or 0)),
        }
        for p in products
    ]


@router.get("/users-full")
def users_full(_user_id: int = Depends(require_admin), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.id.asc()).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "age": u.age,
            "is_admin": bool(u.is_admin),
            "avatar": u.avatar,
            "created_at": u.created_at.isoformat() if getattr(u, "created_at", None) else None,
            "password_hash": getattr(u, "password_hash", None),
        }
        for u in users
    ]


@router.post("/promote")
def promote_user(email: str, _user_id: int = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_admin:
        return {"status": "ok", "message": "Already admin"}
    user.is_admin = True
    db.commit()
    audit("admin.promote", actor_id=_user_id, target=email)
    return {"status": "ok", "message": "Promoted"}


@router.post("/demote")
def demote_user(email: str, _user_id: int = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_admin:
        return {"status": "ok", "message": "Already standard"}
    user.is_admin = False
    db.commit()
    audit("admin.demote", actor_id=_user_id, target=email)
    return {"status": "ok", "message": "Demoted"}


@router.post("/reset-password")
def reset_password(
    email: str,
    new_password: str = Body(..., embed=True, min_length=6),
    _user_id: int = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.password_hash = get_password_hash(new_password)
    db.commit()
    audit("admin.reset_password", actor_id=_user_id, target=email)
    return {"status": "ok", "message": "Password reset"}


# Promo codes
from ..schemas.promo_code import PromoCodeCreate, PromoCodeOut
from ..core.logger import get_recent_logs


@router.post("/promo-codes", response_model=PromoCodeOut)
def create_promo_code(payload: PromoCodeCreate, _user_id: int = Depends(require_admin), db: Session = Depends(get_db)):
    exists = db.query(PromoCode).filter(PromoCode.code == payload.code).first()
    if exists:
        raise HTTPException(status_code=400, detail="Code already exists")
    # Basic validation: either max_uses or expires_at can be provided or both/none
    promo = PromoCode(
        code=payload.code,
        discount=payload.discount,
        max_uses=payload.max_uses,
        expires_at=payload.expires_at,
        is_active=payload.is_active,
    )
    db.add(promo)
    db.commit()
    db.refresh(promo)
    audit("promo.create", actor_id=_user_id, promo_id=promo.id, code=promo.code, discount=promo.discount)
    return promo


@router.get("/promo-codes", response_model=list[PromoCodeOut])
def list_promo_codes(_user_id: int = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(PromoCode).order_by(PromoCode.created_at.desc()).all()


@router.delete("/promo-codes/{promo_id}", status_code=204)
def delete_promo_code(promo_id: int, _user_id: int = Depends(require_admin), db: Session = Depends(get_db)):
    promo = db.query(PromoCode).filter(PromoCode.id == promo_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Promo code not found")
    audit("promo.delete", actor_id=_user_id, promo_id=promo_id, code=promo.code)
    db.delete(promo)
    db.commit()
    return None

# Sales timeseries
from datetime import datetime, timedelta
from fastapi import Query
from sqlalchemy import func as sa_func


@router.get("/sales-timeseries")
def sales_timeseries(
    period: str = Query("day", pattern="^(day|week|month|year)$"),
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    _user_id: int = Depends(require_admin),
    db: Session = Depends(get_db),
):
    # default range: last 30 days
    now = datetime.utcnow()
    if end is None:
        end = now
    if start is None:
        if period == "year":
            start = end - timedelta(days=365)
        elif period == "month":
            start = end - timedelta(days=30)
        elif period == "week":
            start = end - timedelta(days=7)
        else:
            start = end - timedelta(days=1)

    trunc_map = {
        "day": "day",
        "week": "week",
        "month": "month",
        "year": "year",
    }
    trunc = trunc_map.get(period, "day")

    # Use date_trunc for postgres-like; for SQLite, emulate by strftime
    engine_name = db.bind.dialect.name
    if engine_name == "sqlite":
        fmt = {
            "day": "%Y-%m-%d",
            "week": "%Y-%W",
            "month": "%Y-%m",
            "year": "%Y",
        }[period]
        ts = sa_func.strftime(fmt, Order.created_at)
    else:
        ts = sa_func.date_trunc(trunc, Order.created_at)

    q = (
        db.query(
            ts.label("bucket"),
            sa_func.coalesce(sa_func.sum(Order.total), 0).label("revenue"),
            sa_func.count(Order.id).label("orders"),
        )
        .filter(Order.created_at >= start, Order.created_at <= end)
        .group_by("bucket")
        .order_by("bucket")
    )
    rows = q.all()
    result = []
    for b, revenue, orders in rows:
        key = b if isinstance(b, str) else (b.isoformat() if hasattr(b, "isoformat") else str(b))
        result.append({
            "bucket": key,
            "revenue": float(revenue or 0),
            "orders": int(orders or 0),
        })
    return result


@router.get("/logs")
def admin_logs(
    limit: int = 200,
    event: Optional[str] = None,
    actor_id: Optional[int] = None,
    target: Optional[str] = None,
    extras: Optional[str] = None,
    _user_id: int = Depends(require_admin),
):
    """Return recent logs with optional server-side filtering.
    Filters are applied against structured fields when present (event, actor_id, target).
    """
    limit = max(1, min(1000, limit))
    # fetch a reasonable window to filter from (newest first)
    items = get_recent_logs(1000)

    def matches(item: dict) -> bool:
        try:
            # event filter: exact match if structured, otherwise substring match on message
            if event:
                if item.get("event"):
                    if item.get("event") != event:
                        return False
                else:
                    if event.lower() not in (item.get("message", "").lower()):
                        return False
            if actor_id is not None:
                if item.get("actor_id") is None:
                    # fallback: try parsing actor_id from message
                    if f"actor_id={actor_id}" not in item.get("message", ""):
                        return False
                else:
                    if int(item.get("actor_id")) != int(actor_id):
                        return False
            if target:
                t = (item.get("target") or "")
                if target.lower() not in t.lower() and target.lower() not in item.get("message", "").lower():
                    return False
            if extras:
                # check parsed extras dict for substring or exact key=value
                e_lower = extras.lower()
                parsed_extras = item.get("extras") or {}
                # as JSON substring
                if e_lower in (str(parsed_extras).lower()):
                    pass
                elif e_lower in item.get("message", "").lower():
                    pass
                else:
                    # support key=value matching: require all pairs to match if multiple provided separated by space
                    parts = extras.split()
                    ok = True
                    for p in parts:
                        if "=" in p:
                            k, v = p.split("=", 1)
                            sval = str(parsed_extras.get(k)) if k in parsed_extras else None
                            if sval is None or v.lower() not in sval.lower():
                                ok = False
                                break
                        else:
                            # simple substring on extras values
                            found = any(p.lower() in str(v).lower() for v in parsed_extras.values())
                            if not found:
                                ok = False
                                break
                    if not ok:
                        return False
            return True
        except Exception:
            return False

    filtered = [it for it in items if matches(it)]
    return filtered[:limit]


@router.delete("/logs")
def admin_clear_logs(_user_id: int = Depends(require_admin)):
    from ..core.logger import clear_recent_logs
    removed = clear_recent_logs()
    audit("admin.logs.clear", actor_id=_user_id, removed=removed)
    return {"status": "ok", "removed": removed}
