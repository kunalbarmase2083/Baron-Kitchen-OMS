from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models
import database
import parser

# Removed `drop_all` so that your database does not get cleared every time you save a file.
# models.Base.metadata.drop_all(bind=database.engine) 
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Baron Kitchen OMS")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/orders/ai-capture", response_model=models.OrderResponse)
def ai_capture_order(order_req: models.OrderCreate, db: Session = Depends(database.get_db)):
    """
    Takes raw text, calls parser to extract info, calculates totals,
    and injects Order alongside OrderItems.
    """
    parsed_data = parser.parse_messy_text(order_req.raw_text)
    items_data = parsed_data.get("items", [])
    
    # Simple logic to determine a grand total ($15 per item generally)
    grand_total = sum(item["quantity"] * 15.0 for item in items_data)
    
    new_order = models.Order(
        client_name=parsed_data.get("client_name"),
        source=parsed_data.get("source"),
        grand_total=grand_total,
        raw_text=order_req.raw_text,
        status="Pending"
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    
    for item_data in items_data:
        order_item = models.OrderItem(
            order_id=new_order.id,
            item_name=item_data["item_name"],
            quantity=item_data["quantity"]
        )
        db.add(order_item)
        
    db.commit()
    db.refresh(new_order)
    
    return new_order

@app.get("/api/orders", response_model=list[models.OrderResponse])
def get_orders(db: Session = Depends(database.get_db)):
    return db.query(models.Order).order_by(models.Order.timestamp.desc()).all()
