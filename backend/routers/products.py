from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from database import get_db
from auth_utils import get_current_user
import models, uuid

router = APIRouter()

class ProductBody(BaseModel):
    name: str
    sku: str
    description: Optional[str] = ""
    price: float
    stock: int
    category: Optional[str] = ""

def serialize(p):
    return {
        "id": p.id, "name": p.name, "sku": p.sku,
        "description": p.description, "price": p.price,
        "stock": p.stock, "category": p.category,
        "created_at": p.created_at.isoformat()
    }

@router.get("")
def list_products(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return {"products": [serialize(p) for p in db.query(models.Product).order_by(models.Product.created_at.desc()).all()]}

@router.post("", status_code=201)
def create_product(body: ProductBody, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not body.name.strip():
        raise HTTPException(400, "Name is required")
    if not body.sku.strip():
        raise HTTPException(400, "SKU is required")
    if body.price < 0:
        raise HTTPException(400, "Price cannot be negative")
    if body.stock < 0:
        raise HTTPException(400, "Stock cannot be negative")
    if db.query(models.Product).filter(models.Product.sku == body.sku.strip()).first():
        raise HTTPException(409, "SKU already exists")
    product = models.Product(
        id=str(uuid.uuid4())[:8],
        name=body.name.strip(), sku=body.sku.strip(),
        description=body.description, price=body.price,
        stock=body.stock, category=body.category
    )
    db.add(product)
    db.commit()
    return {"product": serialize(product)}

@router.put("/{product_id}")
def update_product(product_id: str, body: ProductBody, db: Session = Depends(get_db), user=Depends(get_current_user)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Product not found")
    if body.sku.strip() != product.sku:
        if db.query(models.Product).filter(models.Product.sku == body.sku.strip()).first():
            raise HTTPException(409, "SKU already exists")
    product.name = body.name.strip()
    product.sku = body.sku.strip()
    product.description = body.description
    product.price = body.price
    product.stock = body.stock
    product.category = body.category
    db.commit()
    return {"product": serialize(product)}

@router.delete("/{product_id}")
def delete_product(product_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Product not found")
    db.delete(product)
    db.commit()
    return {"message": "Product deleted"}
