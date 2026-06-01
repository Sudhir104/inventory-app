import os, hashlib, secrets
from fastapi import HTTPException, Depends, Header
from sqlalchemy.orm import Session
from database import get_db
import models

SECRET = os.getenv("SECRET_KEY", "dev-secret-key")

def hash_password(password: str) -> str:
    return hashlib.sha256((password + SECRET).encode()).hexdigest()

def create_token(user_id: str) -> str:
    return secrets.token_hex(24) + user_id

def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Login required")
    token = authorization[7:]
    # last 8 chars are user id (our simple scheme)
    user_id = token[-8:]
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user
