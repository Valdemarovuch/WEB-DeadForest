from fastapi import APIRouter, Depends, HTTPException, status
from datetime import timedelta, datetime, timezone
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.user import User
from ..schemas.user import UserOut, UserCreate, Token, UserUpdate, ForgotPassword, ResetPassword
from ..core.auth import get_password_hash, verify_password, create_access_token, oauth2_scheme, decode_token, generate_reset_token
from ..core.logger import audit

router = APIRouter()

@router.post("/register", response_model=UserOut)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=payload.name,
        email=payload.email,
        age=payload.age,
        password_hash=get_password_hash(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    try:
        audit("auth.register", actor_id=user.id, target=user.email)
    except Exception:
        pass
    return user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # We use 'username' field to pass email for OAuth2PasswordRequestForm
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id)})
    # Audit successful login (do not log passwords)
    try:
        audit("auth.login", actor_id=user.id, target=user.email)
    except Exception:
        # avoid failing the request if auditing fails
        pass
    return {"access_token": token, "token_type": "bearer"}

@router.post("/refresh")
def refresh(token: str = Depends(oauth2_scheme)):
    # Issue a new access token if the current one is valid (sliding expiration)
    data = decode_token(token)
    sub = data.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    # 30 days by default; can be tuned via ACCESS_TOKEN_EXPIRE_MINUTES env if desired
    new_token = create_access_token({"sub": sub}, expires_delta=timedelta(days=30))
    # Audit token refresh
    try:
        audit("auth.refresh", actor_id=int(sub), target=None)
    except Exception:
        pass
    return {"access_token": new_token, "token_type": "bearer"}

@router.get("/me", response_model=UserOut)
def me(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = decode_token(token)
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.query(User).filter(User.id == int(sub)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/me", response_model=UserOut)
def update_me(payload: UserUpdate, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload_dict = payload.model_dump(exclude_unset=True)
    data = decode_token(token)
    sub = data.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.query(User).filter(User.id == int(sub)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Handle password change
    if "password" in payload_dict and payload_dict["password"]:
        user.password_hash = get_password_hash(payload_dict.pop("password"))
    for k, v in payload_dict.items():
        setattr(user, k, v)
    db.commit()
    db.refresh(user)
    return user

@router.post("/forgot-password")
def forgot_password(payload: ForgotPassword, db: Session = Depends(get_db)):
    """Request password reset - generates a reset token"""
    user = db.query(User).filter(User.email == payload.email).first()
    
    # Always return success to prevent email enumeration
    if not user:
        return {"message": "If the email exists, a reset link has been sent"}
    
    # Generate reset token and set expiration (1 hour)
    reset_token = generate_reset_token()
    user.reset_token = reset_token
    user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
    db.commit()
    
    # In production, send email with reset link
    # For development, we'll log the token
    try:
        audit("auth.forgot_password", actor_id=user.id, target=user.email, 
              metadata={"reset_token": reset_token})
    except Exception:
        pass
    
    # In dev mode, return the token (remove in production!)
    import os
    if os.getenv("DEV_MODE", "true").lower() == "true":
        return {
            "message": "Reset token generated",
            "reset_token": reset_token,
            "reset_url": f"/reset-password?token={reset_token}"
        }
    
    return {"message": "If the email exists, a reset link has been sent"}

@router.post("/reset-password")
def reset_password(payload: ResetPassword, db: Session = Depends(get_db)):
    """Reset password using a valid reset token"""
    user = db.query(User).filter(User.reset_token == payload.token).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    # Check if token is expired
    if not user.reset_token_expires:
        raise HTTPException(status_code=400, detail="Reset token has expired")
    
    # Handle both timezone-aware and timezone-naive datetimes
    now = datetime.now(timezone.utc)
    expires = user.reset_token_expires
    
    # If expires is naive, make it timezone-aware (assume UTC)
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    
    if expires < now:
        raise HTTPException(status_code=400, detail="Reset token has expired")
    
    # Update password and clear reset token
    user.password_hash = get_password_hash(payload.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    
    try:
        audit("auth.password_reset", actor_id=user.id, target=user.email)
    except Exception:
        pass
    
    return {"message": "Password successfully reset"}
