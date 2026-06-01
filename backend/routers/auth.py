from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from database import get_db
from auth_utils import hash_password, create_token, get_current_user
import models, uuid

router = APIRouter()

class SignupBody(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginBody(BaseModel):
    email: EmailStr
    password: str

@router.post("/signup", status_code=201)
def signup(body: SignupBody, db: Session = Depends(get_db)):
    if len(body.name.strip()) < 2:
        raise HTTPException(400, "Name must be at least 2 characters")
    if len(body.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    if db.query(models.User).filter(models.User.email == body.email.lower()).first():
        raise HTTPException(409, "Email already registered")
    user = models.User(
        id=str(uuid.uuid4())[:8],
        name=body.name.strip(),
        email=body.email.lower(),
        password_hash=hash_password(body.password)
    )
    db.add(user)
    db.commit()
    token = create_token(user.id)
    return {"token": token, "user": {"id": user.id, "name": user.name, "email": user.email}}

@router.post("/login")
def login(body: LoginBody, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == body.email.lower()).first()
    if not user or user.password_hash != hash_password(body.password):
        raise HTTPException(401, "Invalid email or password")
    token = create_token(user.id)
    return {"token": token, "user": {"id": user.id, "name": user.name, "email": user.email}}

@router.get("/me")
def me(user=Depends(get_current_user)):
    return {"id": user.id, "name": user.name, "email": user.email}
