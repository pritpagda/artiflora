import os
from datetime import datetime

import razorpay
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Request, status, Body
from fastapi.middleware.cors import CORSMiddleware
from imagekitio import ImageKit

import services
from auth import get_current_user, get_current_admin_user
from database import connect_to_db
from models import Product, Order, OrderStatusUpdate

load_dotenv()

app = FastAPI(title="Artiflora")
origins = [origin.strip() for origin in os.getenv("ORIGINS", "").split(",") if origin.strip()]

app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"],
                   allow_headers=["*"], )

imagekit = ImageKit(private_key=os.getenv("IMAGEKIT_PRIVATE_KEY"), public_key=os.getenv("IMAGEKIT_PUBLIC_KEY"),
                    url_endpoint=os.getenv("IMAGEKIT_URL_ENDPOINT"))

razorpay_client = razorpay.Client(auth=(os.getenv("RAZORPAY_KEY_ID"), os.getenv("RAZORPAY_KEY_SECRET")))


@app.on_event("startup")
async def startup_db():
    await connect_to_db(app)


@app.get("/")
async def root():
    return {"status": "ok"}


@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow()}


@app.get("/auth/me")
async def auth_me(request: Request, user=Depends(get_current_user)):
    admin_user = await request.app.mongodb.admin_users.find_one({"uid": user["uid"]})
    is_admin = bool(admin_user)
    return {"uid": user["uid"], "email": user.get("email"), "isAdmin": is_admin, }


@app.get("/protected")
async def protected_route(user=Depends(get_current_user)):
    return {"message": "You are authenticated!", "uid": user["uid"], "email": user.get("email"), }


@app.post("/products", status_code=status.HTTP_201_CREATED)
async def create_product(request: Request, product: Product, user=Depends(get_current_admin_user)):
    return await services.create_product(request, product)


@app.get("/products")
async def list_products(request: Request):
    return await services.list_products(request)


@app.get("/products/{product_id}")
async def get_product(request: Request, product_id: str):
    product = await services.get_product(request, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@app.put("/products/{product_id}")
async def update_product(request: Request, product_id: str, product: Product, user=Depends(get_current_admin_user)):
    result = await services.update_product(request, product_id, product)
    if result["modified_count"] == 0:
        raise HTTPException(status_code=404, detail="Product not found or no changes made")
    return {"message": "Product updated"}


@app.delete("/products/{product_id}")
async def delete_product(request: Request, product_id: str, user=Depends(get_current_admin_user)):
    result = await services.delete_product(request, product_id)
    if result["deleted_count"] == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}


@app.get("/imagekit-auth")
def get_imagekit_auth():
    auth_params = imagekit.get_authentication_parameters()
    return auth_params


@app.post("/orders", status_code=status.HTTP_201_CREATED)
async def create_order_route(order: Order, user=Depends(get_current_user), request: Request = None):
    order.user_id = user["uid"]
    order.created_at = datetime.utcnow()
    order.status = "Ordered"
    return await services.create_order(request, order)


@app.get("/orders")
async def list_orders(request: Request, user=Depends(get_current_admin_user)):
    return await services.list_orders(request)


@app.get("/orders/me")
async def get_my_orders(request: Request, user=Depends(get_current_user)):
    return await services.get_orders_by_user(request, user["uid"])


@app.put("/orders/{order_id}/status")
async def update_order_status(request: Request, order_id: str, status_update: OrderStatusUpdate,
                              user=Depends(get_current_admin_user)):
    result = await services.update_order_status(request, order_id, status_update.status)
    if result["modified_count"] == 0:
        raise HTTPException(status_code=404, detail="Order not found or status was not changed")
    return {"message": "Order status updated successfully"}


@app.get("/orders/{order_id}")
async def get_order_by_id(request: Request, order_id: str, user=Depends(get_current_user)):
    order = await services.get_order_by_id(request, order_id)

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@app.post("/razorpay/create-order")
async def create_razorpay_order(amount: int = Body(..., embed=True), user=Depends(get_current_user)):
    try:
        razorpay_order = razorpay_client.order.create({"amount": amount, "currency": "INR", "payment_capture": 1})
        return {"order_id": razorpay_order['id'], "amount": amount, "currency": "INR"}
    except Exception as e:
        return {"error": str(e)}


@app.post("/razorpay/verify-payment")
async def verify_payment(payload: dict = Body(...), user=Depends(get_current_user)):
    try:
        params_dict = {'razorpay_order_id': payload['razorpay_order_id'],
                       'razorpay_payment_id': payload['razorpay_payment_id'],
                       'razorpay_signature': payload['razorpay_signature']}
        razorpay_client.utility.verify_payment_signature(params_dict)
        return {"status": "Payment signature verified"}
    except razorpay.errors.SignatureVerificationError:
        return {"status": "Invalid signature"}
    except Exception as e:
        return {"error": str(e)}
