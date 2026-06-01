from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from sqlalchemy.orm import Session
from database import get_db
from auth_utils import get_current_user
import models, uuid

router = APIRouter()

class CustomerBody(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = ""
    address: Optional[str] = ""

def serialize(c):
    return {
        "id": c.id, "name": c.name, "email": c.email,
        "phone": c.phone, "address": c.address,
        "created_at": c.created_at.isoformat()
    }

@router.get("")
def list_customers(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return {"customers": [serialize(c) for c in db.query(models.Customer).order_by(models.Customer.created_at.desc()).all()]}

@router.post("", status_code=201)
def create_customer(body: CustomerBody, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not body.name.strip():
        raise HTTPException(400, "Name is required")
    if db.query(models.Customer).filter(models.Customer.email == body.email.lower()).first():
        raise HTTPException(409, "Email already registered")
    customer = models.Customer(
        id=str(uuid.uuid4())[:8],
        name=body.name.strip(), email=body.email.lower(),
        phone=body.phone, address=body.address
    )
    db.add(customer)
    db.commit()
    return {"customer": serialize(customer)}

@router.put("/{customer_id}")
def update_customer(customer_id: str, body: CustomerBody, db: Session = Depends(get_db), user=Depends(get_current_user)):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(404, "Customer not found")
    if body.email.lower() != customer.email:
        if db.query(models.Customer).filter(models.Customer.email == body.email.lower()).first():
            raise HTTPException(409, "Email already registered")
    customer.name = body.name.strip()
    customer.email = body.email.lower()
    customer.phone = body.phone
    customer.address = body.address
    db.commit()
    return {"customer": serialize(customer)}

@router.delete("/{customer_id}")
def delete_customer(customer_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(404, "Customer not found")
    db.delete(customer)
    db.commit()
    return {"message": "Customer deleted"}
