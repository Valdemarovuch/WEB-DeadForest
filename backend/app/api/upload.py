import os
import uuid
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.auth import oauth2_scheme, decode_token
from ..models.user import User

router = APIRouter()

MAX_SIZE = 2 * 1024 * 1024  # 2MB
# Keep avatar types restricted (no GIFs for avatars)
ALLOWED_AVATAR_TYPES = {"image/jpeg", "image/png", "image/webp"}
# Product images may include animated GIF previews
ALLOWED_PRODUCT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_token(token)
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.query(User).filter(User.id == int(sub)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if file.content_type not in ALLOWED_AVATAR_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported file type. Use JPG, PNG, or WEBP.")
    # Read into memory for size check (simple approach for small limit)
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max 2MB.")

    ext = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
    }[file.content_type]
    fname = f"{uuid.uuid4().hex}{ext}"
    out_dir = "backend/uploads"
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, fname)
    with open(out_path, "wb") as f:
        f.write(content)

    # Save public path (served via /uploads)
    public_path = f"/uploads/{fname}"
    user.avatar = public_path
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"avatar": public_path}


@router.post("/product-image")
async def upload_product_image(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_PRODUCT_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported file type. Use JPG, PNG, WEBP or GIF.")
    # Read into memory for size check
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:  # 5MB for product images
        raise HTTPException(status_code=400, detail="File too large. Max 5MB.")

    ext = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
    }[file.content_type]
    fname = f"product_{uuid.uuid4().hex}{ext}"
    out_dir = "backend/uploads"
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, fname)
    with open(out_path, "wb") as f:
        f.write(content)

    # Return public path (served via /uploads)
    public_path = f"/uploads/{fname}"
    return {"image_url": public_path}
