from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from .core.logger import setup_logging, set_request_id, reset_request_id, enable_sql_logging
from .api.routes import api_router
from .core import Base, engine
import logging
import time
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from .models.product import Product
from .models.user import User
from .models.promo_code import PromoCode
from .core.auth import get_password_hash
from sqlalchemy import text
from fastapi.staticfiles import StaticFiles
import os
from collections import deque

ERROR_WINDOW_SEC = 60
try:
    ERROR_SPIKE_THRESHOLD = int(os.getenv("ERROR_SPIKE_THRESHOLD", "10"))
except Exception:
    ERROR_SPIKE_THRESHOLD = 10
_error_times = deque()
_last_spike_alert = 0.0

load_dotenv()

setup_logging()

app = FastAPI(title="DeadForest", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
app.mount("/uploads", StaticFiles(directory="backend/uploads"), name="uploads")

@app.get("/", tags=["health"])
async def root():
    return {"status": "ok", "service": "DeadForest"}


@app.on_event("startup")
def on_startup():
    # Auto-create tables
    Base.metadata.create_all(bind=engine)
    # Lightweight SQLite migration for schema changes without Alembic
    try:
        with engine.begin() as conn:
            cols = {row[1] for row in conn.exec_driver_sql("PRAGMA table_info(products)").all()}
            if "tags" not in cols:
                conn.exec_driver_sql("ALTER TABLE products ADD COLUMN tags TEXT")
            if "programs" not in cols:
                conn.exec_driver_sql("ALTER TABLE products ADD COLUMN programs TEXT")
            if "file_type" not in cols:
                conn.exec_driver_sql("ALTER TABLE products ADD COLUMN file_type VARCHAR(20)")
            if "rating" not in cols:
                # Use REAL for SQLite to represent numeric rating
                conn.exec_driver_sql("ALTER TABLE products ADD COLUMN rating REAL")
            # users.is_admin
            ucols = {row[1] for row in conn.exec_driver_sql("PRAGMA table_info(users)").all()}
            if "is_admin" not in ucols:
                conn.exec_driver_sql("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0")
            if "avatar" not in ucols:
                conn.exec_driver_sql("ALTER TABLE users ADD COLUMN avatar VARCHAR(255)")
            # promo_codes table (create if missing)
            conn.exec_driver_sql(
                """
                CREATE TABLE IF NOT EXISTS promo_codes (
                    id INTEGER PRIMARY KEY, 
                    code VARCHAR(64) NOT NULL UNIQUE,
                    discount FLOAT NOT NULL DEFAULT 0,
                    max_uses INTEGER,
                    uses INTEGER NOT NULL DEFAULT 0,
                    expires_at DATETIME,
                    is_active INTEGER NOT NULL DEFAULT 1,
                    created_at DATETIME
                )
                """
            )
    except Exception as e:
        logging.getLogger("startup").warning("Schema migration skipped or failed: %s", e)
    # Seed a few products if none exist
    with Session(engine) as db:
        # Seed default admin if no users
        try:
            if db.query(User).count() == 0:
                admin = User(
                    name="Admin",
                    email="admin@example.com",
                    age=None,
                    password_hash=get_password_hash("admin123"),
                    is_admin=True,
                )
                db.add(admin)
                db.commit()
        except Exception as e:
            logging.getLogger("startup").warning("Admin seed skipped: %s", e)
        count = db.query(Product).count()
        if count == 0:
            demo = [
                Product(name="Dark UI Kit Pro", price=49, image="/placeholder-3e3y4.png", category="UI Kits", tags="Modern,Dark,Professional", rating=4.8, sales=234),
                Product(name="Holographic Icons", price=29, image="/placeholder-7cym3.png", category="Icon Sets", tags="Creative,Holographic,Modern", rating=4.9, sales=156),
                Product(name="Minimal Dashboard Template", price=89, image="/placeholder-yjy8k.png", category="Templates", tags="Minimal,Dashboard,Clean", rating=4.7, sales=89),
                Product(name="Cyber Typography Pack", price=39, image="/placeholder-x8jyn.png", category="Fonts", tags="Futuristic,Typography,Cyber", rating=4.6, sales=67),
                Product(name="Abstract Graphics Bundle", price=59, image="/abstract-digital-graphics-bundle-modern.jpg", category="Graphics", tags="Abstract,Digital,Bundle", rating=4.8, sales=123),
                Product(name="Dark Landing Page Kit", price=69, image="/dark-landing-page-template-modern-web.jpg", category="Templates", tags="Landing,Dark,Web", rating=4.9, sales=198),
            ]
            for p in demo:
                db.add(p)
            db.commit()


@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger = logging.getLogger("request")
    global _last_spike_alert
    # set request id (use header x-request-id if present)
    req_id = request.headers.get("x-request-id") or f"req-{int(time.time()*1000)}"
    token = set_request_id(req_id)
    start = time.time()
    try:
        response = await call_next(request)
        duration_ms = int((time.time() - start) * 1000)
        # extra context
        ip = request.headers.get("x-forwarded-for") or request.client.host if request.client else "-"
        ua = request.headers.get("user-agent", "-")
        logger.info("%s %s -> %s (%d ms) ip=%s ua=%s", request.method, request.url.path, response.status_code, duration_ms, ip, ua)
        # spike detection for 5xx responses
        if getattr(response, "status_code", 200) >= 500:
            now = time.time()
            _error_times.append(now)
            # drop old
            cutoff = now - ERROR_WINDOW_SEC
            while _error_times and _error_times[0] < cutoff:
                _error_times.popleft()
            if len(_error_times) >= ERROR_SPIKE_THRESHOLD and (now - _last_spike_alert) > ERROR_WINDOW_SEC:
                logging.getLogger("alert").warning(
                    "error_spike count=%d window=%ds threshold=%d", len(_error_times), ERROR_WINDOW_SEC, ERROR_SPIKE_THRESHOLD
                )
                _last_spike_alert = now
        return response
    except Exception as e:
        duration_ms = int((time.time() - start) * 1000)
        ip = request.headers.get("x-forwarded-for") or request.client.host if request.client else "-"
        ua = request.headers.get("user-agent", "-")
        logger.exception("%s %s -> 500 (%d ms) error=%s ip=%s ua=%s", request.method, request.url.path, duration_ms, e, ip, ua)
        # record exception as 5xx for spike detection
        now = time.time()
        _error_times.append(now)
        cutoff = now - ERROR_WINDOW_SEC
        while _error_times and _error_times[0] < cutoff:
            _error_times.popleft()
        if len(_error_times) >= ERROR_SPIKE_THRESHOLD and (now - _last_spike_alert) > ERROR_WINDOW_SEC:
            logging.getLogger("alert").warning(
                "error_spike count=%d window=%ds threshold=%d", len(_error_times), ERROR_WINDOW_SEC, ERROR_SPIKE_THRESHOLD
            )
            _last_spike_alert = now
        raise
    finally:
        reset_request_id(token)

# Enable slow SQL logging
try:
    enable_sql_logging(engine)
except Exception as _e:
    logging.getLogger("startup").warning("SQL logging not enabled: %s", _e)
