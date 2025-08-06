import firebase_admin
from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer
from firebase_admin import credentials, auth as firebase_auth

SERVICE_ACCOUNT_PATH = "/etc/secrets/artiflora-c8c9a-firebase-adminsdk-fbsvc-922edd3978.json"

if not firebase_admin._apps:
    cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
    firebase_admin.initialize_app(cred)

bearer_scheme = HTTPBearer()


async def verify_token(token=Depends(bearer_scheme)):
    try:

        decoded_token = firebase_auth.verify_id_token(token.credentials)
        uid = decoded_token.get("uid")
        email = decoded_token.get("email")
        return {"uid": uid, "email": email}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired Firebase token")


async def get_current_user(user=Depends(verify_token)):
    return user


async def get_current_admin_user(request: Request, user=Depends(get_current_user)):
    admin_user = await request.app.mongodb.admin_users.find_one({"uid": user["uid"]})
    if not admin_user:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return user
