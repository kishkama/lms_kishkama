from datetime import datetime, timezone


def utcnow() -> datetime:
    """Naive UTC datetime — used consistently for both storage and comparison so
    SQLite (which drops tzinfo on read) and Postgres compare equally."""
    return datetime.now(timezone.utc).replace(tzinfo=None)
