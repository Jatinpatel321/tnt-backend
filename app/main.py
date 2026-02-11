from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.modules.payments.router import router as payments_router
from app.modules.auth.router import router as auth_router
from app.modules.users.router import router as users_router
from app.modules.slots.router import router as slots_router
from app.modules.orders.router import router as orders_router
from app.database.init_db import init_db
from app.modules.payments.webhook import router as razorpay_webhook_router
from fastapi.staticfiles import StaticFiles
from app.modules.admin.router import router as admin_router
from app.modules.stationery.router import router as stationery_router
from app.modules.stationery.payment_router import router as stationery_payment_router
from app.modules.notifications.router import router as notification_router
from app.modules.rewards.router import router as rewards_router
from app.modules.group_cart.router import router as group_cart_router
from app.modules.signals.router import router as signals_router


app = FastAPI(title="TNT – Tap N Take")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()

app.include_router(auth_router)
app.include_router(users_router)   # 👈 THIS WAS MISSING
app.include_router(slots_router)
app.include_router(orders_router)
app.include_router(payments_router)
app.include_router(razorpay_webhook_router)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.include_router(admin_router)
app.include_router(stationery_router)
app.include_router(stationery_payment_router)
app.include_router(notification_router)
app.include_router(rewards_router)
app.include_router(group_cart_router)
app.include_router(signals_router)
