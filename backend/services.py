from typing import List, Optional

from bson import ObjectId
from fastapi import Request
from motor.motor_asyncio import AsyncIOMotorCursor

from models import Product, Order


def obj_id_to_str(doc):
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc


async def create_product(request: Request, product: Product):
    product_dict = product.dict()
    result = await request.app.mongodb["products"].insert_one(product_dict)
    return {"inserted_id": str(result.inserted_id)}


async def list_products(request: Request) -> List[dict]:
    cursor = request.app.mongodb["products"].find()
    products = []
    async for doc in cursor:
        products.append(obj_id_to_str(doc))
    return products


async def get_product(request: Request, product_id: str):
    doc = await request.app.mongodb["products"].find_one({"_id": ObjectId(product_id)})
    if doc:
        return obj_id_to_str(doc)
    return None


async def update_product(request: Request, product_id: str, product: Product):
    update_result = await request.app.mongodb["products"].update_one({"_id": ObjectId(product_id)},
                                                                     {"$set": product.dict()})
    return {"modified_count": update_result.modified_count}


async def delete_product(request: Request, product_id: str):
    delete_result = await request.app.mongodb["products"].delete_one({"_id": ObjectId(product_id)})
    return {"deleted_count": delete_result.deleted_count}


async def list_orders(request: Request) -> List[dict]:
    cursor = request.app.mongodb["orders"].find()
    orders = []
    async for doc in cursor:
        orders.append(obj_id_to_str(doc))
    return orders


async def create_order(request: Request, order: Order):
    order_dict = order.dict(by_alias=True, exclude_unset=True)

    order_dict.pop("_id", None)
    result = await request.app.mongodb["orders"].insert_one(order_dict)
    inserted_doc = await request.app.mongodb["orders"].find_one({"_id": result.inserted_id})
    return obj_id_to_str(inserted_doc)


async def get_orders_by_user(request: Request, user_id: str) -> List[dict]:
    orders_cursor: AsyncIOMotorCursor = request.app.mongodb["orders"].find({"user_id": user_id})
    orders_cursor.sort("created_at", -1)

    orders = []
    async for doc in orders_cursor:
        orders.append(obj_id_to_str(doc))

    return orders


async def update_order_status(request: Request, order_id: str, status: str):
    update_result = await request.app.mongodb["orders"].update_one({"_id": ObjectId(order_id)},
                                                                   {"$set": {"status": status}})
    return {"modified_count": update_result.modified_count}


async def get_order_by_id(request: Request, order_id: str) -> Optional[dict]:
    try:
        doc = await request.app.mongodb["orders"].find_one({"_id": ObjectId(order_id)})
        if doc:
            return obj_id_to_str(doc)
        return None
    except Exception as e:
        print("Error in get_order_by_id:", e)
        return None
