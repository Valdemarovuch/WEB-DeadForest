import logging
import os
import sys
import contextvars
from logging.handlers import RotatingFileHandler
import re
from time import perf_counter
from collections import deque
from datetime import datetime, timezone

request_id_var: contextvars.ContextVar[str] = contextvars.ContextVar("request_id", default="-")
LOG_BUFFER = deque(maxlen=int(os.getenv("LOG_BUFFER_SIZE", "500")))


class RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        try:
            record.request_id = request_id_var.get()
        except Exception:
            record.request_id = "-"
        return True


MASK_PATTERNS = [
    (re.compile(r"([A-Za-z0-9._%+-]+)@([A-Za-z0-9.-]+\.[A-Za-z]{2,})"), "***@***"),
    (re.compile(r"\b\+?\d[\d\s().-]{7,}\b"), "***"),
]


def _mask_pii(message: str) -> str:
    try:
        out = message
        for pat, repl in MASK_PATTERNS:
            out = pat.sub(repl, out)
        return out
    except Exception:
        return message


MAX_MSG_LEN = int(os.getenv("LOG_MAX_MESSAGE", "2000"))


def _fmt_message(msg: str) -> str:
    if not isinstance(msg, str):
        try:
            msg = str(msg)
        except Exception:
            msg = "<unrepr>"
    msg = msg.replace("\n", " ")
    msg = _mask_pii(msg)
    if len(msg) > MAX_MSG_LEN:
        msg = msg[:MAX_MSG_LEN] + "…"
    return msg


def setup_logging(level: int | None = None):
    logger = logging.getLogger()
    if logger.handlers:
        return

    # Resolve level from env if not provided
    level_name = os.getenv("LOG_LEVEL", "INFO").upper()
    resolved_level = level or getattr(logging, level_name, logging.INFO)

    use_json = os.getenv("LOG_JSON", "0") in {"1", "true", "TRUE"}
    if use_json:
        try:
            from pythonjsonlogger import jsonlogger

            class _PIIJsonFormatter(jsonlogger.JsonFormatter):
                def process_log_record(self, log_record):
                    log_record = super().process_log_record(log_record)
                    if "message" in log_record:
                        log_record["message"] = _fmt_message(log_record["message"])
                    return log_record

            formatter = _PIIJsonFormatter("%(asctime)s %(levelname)s %(name)s %(request_id)s %(message)s")
        except Exception:
            formatter = logging.Formatter(
                "%(asctime)s level=%(levelname)s logger=%(name)s request_id=%(request_id)s msg=%(message)s"
            )
    else:
        formatter = logging.Formatter(
            "%(asctime)s level=%(levelname)s logger=%(name)s request_id=%(request_id)s msg=%(message)s"
        )

    stream = logging.StreamHandler(sys.stdout)
    stream.setFormatter(formatter)
    stream.addFilter(RequestIdFilter())

    logger.setLevel(resolved_level)
    logger.addHandler(stream)

    # Optional file logging
    log_file = os.getenv("LOG_FILE")
    if log_file:
        try:
            file_handler = RotatingFileHandler(log_file, maxBytes=10 * 1024 * 1024, backupCount=5)
            file_handler.setFormatter(formatter)
            file_handler.addFilter(RequestIdFilter())
            logger.addHandler(file_handler)
        except Exception as e:
            logging.getLogger("logger").warning("Failed to init file logger: %s", e)

    # In-memory buffer handler for recent logs (for admin UI)
    try:
        buffer_handler = _BufferHandler()
        buffer_handler.setLevel(resolved_level)
        buffer_handler.addFilter(RequestIdFilter())
        logger.addHandler(buffer_handler)
    except Exception as e:
        logging.getLogger("logger").warning("Failed to init buffer logger: %s", e)

    # Suppress overly verbose logs from libraries
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

    # Optional Sentry
    dsn = os.getenv("SENTRY_DSN")
    if dsn:
        try:
            import sentry_sdk

            sentry_sdk.init(dsn=dsn, traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.0")))
            logging.getLogger("logger").info("Sentry initialized")
        except Exception as e:
            logging.getLogger("logger").warning("Failed to init Sentry: %s", e)


def set_request_id(value: str):
    return request_id_var.set(value)


def reset_request_id(token):
    try:
        request_id_var.reset(token)
    except Exception:
        # no-op
        pass


def enable_sql_logging(engine, threshold_ms: int = 200):
    """Log slow SQL statements over threshold_ms using engine events."""
    try:
        from sqlalchemy import event

        @event.listens_for(engine, "before_cursor_execute")
        def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
            conn.info.setdefault("_query_start_time", []).append(perf_counter())

        @event.listens_for(engine, "after_cursor_execute")
        def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
            try:
                start = conn.info.get("_query_start_time").pop(-1)
            except Exception:
                return
            total_ms = (perf_counter() - start) * 1000.0
            if total_ms >= threshold_ms:
                logging.getLogger("sql.slow").warning(
                    "slow_sql duration_ms=%d stmt=%s",
                    int(total_ms),
                    (statement or "").strip().replace("\n", " ")[:1000],
                )
    except Exception as e:
        logging.getLogger("logger").warning("Failed to enable SQL logging: %s", e)


class _BufferHandler(logging.Handler):
    def emit(self, record: logging.LogRecord) -> None:
        try:
            # Basic structured record
            entry = {
                "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
                "level": record.levelname,
                "logger": record.name,
                "request_id": getattr(record, "request_id", "-"),
                "message": _fmt_message(record.getMessage()),
            }
            # If this is an audit logger entry (we use key format like: event=auth.login actor_id=1 target=...)
            if record.name == "audit":
                try:
                    # parse key=value pairs from the message
                    text = record.getMessage()
                    parts = text.split()
                    # first part should be event=...
                    parsed = {}
                    for p in parts:
                        if "=" in p:
                            k, v = p.split("=", 1)
                            parsed[k] = v
                    # attach structured fields
                    entry["event"] = parsed.get("event")
                    # common fields
                    if "actor_id" in parsed:
                        try:
                            entry["actor_id"] = int(parsed.get("actor_id"))
                        except Exception:
                            entry["actor_id"] = parsed.get("actor_id")
                    if "target" in parsed:
                        entry["target"] = parsed.get("target")
                    # extras: keep other parsed keys
                    extras = {k: v for k, v in parsed.items() if k not in {"event", "actor_id", "target"}}
                    entry["extras"] = extras
                except Exception:
                    entry["event"] = None
                    entry["extras"] = {}

            LOG_BUFFER.append(entry)
        except Exception:
            pass


def get_recent_logs(limit: int = 200):
    if limit <= 0:
        return []
    # Return newest first
    items = list(LOG_BUFFER)[-limit:]
    # Attempt to return structured entries; newer first
    return items[::-1]


def clear_recent_logs():
    """Clear the in-memory recent log buffer and return number of removed items."""
    count = len(LOG_BUFFER)
    LOG_BUFFER.clear()
    return count


def audit(event: str, **fields):
    """Log an audit event (security-sensitive operations).
    Avoid logging secrets. Fields will be rendered as key=value in the message.
    """
    logger = logging.getLogger("audit")
    # build logfmt-like payload
    parts = [f"event={event}"]
    for k, v in fields.items():
        try:
            sval = str(v).replace("\n", " ")
        except Exception:
            sval = "<unrepr>"
        if "password" in k.lower():
            sval = "***"
        parts.append(f"{k}={sval}")
    logger.info(" ".join(parts))
