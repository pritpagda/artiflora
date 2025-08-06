import os

from motor.motor_asyncio import AsyncIOMotorClient

DB_URL = os.getenv('DB_URL')


async def connect_to_db(app):
    client = AsyncIOMotorClient(DB_URL)
    app.mongodb = client.artiflora
