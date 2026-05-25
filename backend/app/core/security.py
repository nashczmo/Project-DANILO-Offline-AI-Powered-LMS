import os
from datetime import datetime, timedelta, timezone

import jwt
import bcrypt

def hash_password(password: str) -> str:
    pwd_bytes = str(password).encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('ascii')


def verify_password(password: str, stored_hash: str | None) -> bool:
    if not stored_hash:
        return False
    try:
        return bcrypt.checkpw(str(password).encode('utf-8'), stored_hash.encode('ascii'))
    except Exception:
        return False


def create_access_token(payload: dict, secret: str, expires_minutes: int) -> str:
    claims = payload.copy()
    claims["exp"] = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    return jwt.encode(claims, secret, algorithm="HS256")


def decode_access_token(token: str, secret: str) -> dict:
    return jwt.decode(token, secret, algorithms=["HS256"])
