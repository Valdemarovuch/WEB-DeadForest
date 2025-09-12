from fastapi import APIRouter
from .users import router as users_router
from .auth import router as auth_router
from .products import router as products_router
from .cart import router as cart_router
from .orders import router as orders_router
from .admin import router as admin_router
from .upload import router as upload_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"]) 
# Also mount at root for convenience
api_router.include_router(auth_router, tags=["auth"]) 
api_router.include_router(users_router, prefix="/users", tags=["users"]) 
api_router.include_router(products_router, prefix="/products", tags=["products"]) 
api_router.include_router(cart_router, prefix="/cart", tags=["cart"]) 
api_router.include_router(orders_router, prefix="/orders", tags=["orders"]) 
api_router.include_router(admin_router, prefix="/admin", tags=["admin"])
api_router.include_router(upload_router, prefix="/auth", tags=["auth"])
