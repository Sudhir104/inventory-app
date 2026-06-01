from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from database import get_db
from auth_utils import get_current_user
import models, uuid

router = APIRouter()

class OrderItemBody(BaseModel):
    product_id: str
    quantity: int

class OrderBody(BaseModel):
    customer_id: str
    items: List[OrderItemBody]
    notes: Optional[str] = ""

VALID_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"]

def serialize(order):
    return {
        "id": order.id,
        "customer_id": order.customer_id,
        "customer_name": order.customer.name if order.customer else "Unknown",
        "status": order.status,
        "total": order.total,
        "notes": order.notes,
        "created_at": order.created_at.isoformat(),
        "items": [
            {
                "id": i.id,
                "product_id": i.product_id,
                "product_name": i.product.name if i.product else "Unknown",
                "quantity": i.quantity,
                "unit_price": i.unit_price
            }
            for i in order.items
        ]
    }

@router.get("")
def list_orders(db: Session = Depends(get_db), user=Depends(get_current_user)):
    orders = db.query(models.Order).order_by(models.Order.created_at.desc()).all()
    return {"orders": [serialize(o) for o in orders]}

@router.post("", status_code=201)
def create_order(body: OrderBody, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not body.items:
        raise HTTPException(400, "Order must have at least one item")
    customer = db.query(models.Customer).filter(models.Customer.id == body.customer_id).first()
    if not customer:
        raise HTTPException(400, "Customer not found")

    total = 0.0
    resolved_items = []
    for item in body.items:
        if item.quantity < 1:
            raise HTTPException(400, "Quantity must be at least 1")
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not product:
            raise HTTPException(400, f"Product {item.product_id} not found")
        if product.stock < item.quantity:
            raise HTTPException(400, f"Not enough stock for '{product.name}'. Available: {product.stock}")
        resolved_items.append((product, item.quantity))
        total += product.price * item.quantity

    order = models.Order(
        id=str(uuid.uuid4())[:8],
        customer_id=body.customer_id,
        total=round(total, 2),
        notes=body.notes
    )
    db.add(order)
    db.flush()

    for product, qty in resolved_items:
        db.add(models.OrderItem(
            id=str(uuid.uuid4())[:8],
            order_id=order.id,
            product_id=product.id,
            quantity=qty,
            unit_price=product.price
        ))
        product.stock -= qty

    db.commit()
    db.refresh(order)
    return {"order": serialize(order)}

@router.patch("/{order_id}/status")
def update_status(order_id: str, body: dict, db: Session = Depends(get_db), user=Depends(get_current_user)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Order not found")
    status = body.get("status", "")
    if status not in VALID_STATUSES:
        raise HTTPException(400, "Invalid status")
    order.status = status
    db.commit()
    return {"order": serialize(order)}

@router.delete("/{order_id}")
def delete_order(order_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Order not found")
    # restore stock
    for item in order.items:
        if item.product:
            item.product.stock += item.quantity
    db.delete(order)
    db.commit()
    return {"message": "Order deleted"}

@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), user=Depends(get_current_user)):
    orders = db.query(models.Order).all()
    products = db.query(models.Product).all()
    customers = db.query(models.Customer).all()
    revenue = sum(o.total for o in orders if o.status != "cancelled")
    low_stock = [{"id": p.id, "name": p.name, "sku": p.sku, "stock": p.stock} for p in products if p.stock <= 5]
    by_status = {}
    for o in orders:
        by_status[o.status] = by_status.get(o.status, 0) + 1
    return {
        "total_orders": len(orders),
        "total_products": len(products),
        "total_customers": len(customers),
        "total_revenue": round(revenue, 2),
        "low_stock": low_stock,
        "orders_by_status": by_status
    }
