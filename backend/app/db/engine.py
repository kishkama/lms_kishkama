"""Shared helper for turning a DATABASE_URL into async engine kwargs.

Neon (and most managed Postgres providers) hand out connection strings with
a libpq-style ``sslmode=require`` query parameter. The asyncpg driver does
not understand that parameter and raises a TypeError if it's left on the
URL, so it's stripped out here and translated into the ``ssl`` connect_arg
asyncpg does understand.
"""

import ssl
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit


def build_engine_kwargs(database_url: str) -> dict:
    parts = urlsplit(database_url)
    connect_args: dict = {}

    if parts.scheme.startswith("postgresql"):
        query = dict(parse_qsl(parts.query))
        sslmode = query.pop("sslmode", None)
        if sslmode and sslmode != "disable":
            connect_args["ssl"] = ssl.create_default_context()
        database_url = urlunsplit(
            (parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment)
        )

    return {"url": database_url, "connect_args": connect_args}
