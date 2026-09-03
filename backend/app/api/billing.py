from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import razorpay
import hmac
import hashlib
from app.config import get_settings

router = APIRouter()
settings = get_settings()

RAZORPAY_KEY_ID = settings.razorpay_key_id or None
RAZORPAY_KEY_SECRET = settings.razorpay_key_secret or None

# Initialize Razorpay Client
if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
    client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
else:
    client = None

class OrderRequest(BaseModel):
    amount: int  # in paise
    currency: str = "INR"
    receipt: str = "receipt_01"

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

@router.post("/create-order")
async def create_order(request: OrderRequest):
    if not client:
        raise HTTPException(status_code=500, detail="Razorpay credentials not configured")
    
    if request.amount < 100:
        raise HTTPException(status_code=400, detail="Amount must be at least 100 paise")
    
    try:
        order_data = {
            "amount": request.amount,
            "currency": request.currency,
            "receipt": request.receipt,
            "payment_capture": 1
        }
        order = client.order.create(data=order_data)
        return {
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from app.api.auth import verify_token
from app.api.database import supabase

@router.post("/verify-payment")
async def verify_payment(
    request: VerifyPaymentRequest,
    current_user: str = Depends(verify_token)
):
    if not RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=500, detail="Razorpay secret not configured")
    
    try:
        # Generate signature
        msg = f"{request.razorpay_order_id}|{request.razorpay_payment_id}"
        generated_signature = hmac.new(
            key=RAZORPAY_KEY_SECRET.encode('utf-8'),
            msg=msg.encode('utf-8'),
            digestmod=hashlib.sha256
        ).hexdigest()
        
        if generated_signature == request.razorpay_signature:
            # Payment successful - update DB to Studio tier
            if supabase:
                try:
                    # Check if row exists first to decide insert vs update
                    res = supabase.table("user_subscriptions").select("*").eq("user_id", current_user).execute()
                    if res.data and len(res.data) > 0:
                        supabase.table("user_subscriptions").update({
                            "tier": "studio"
                        }).eq("user_id", current_user).execute()
                    else:
                        supabase.table("user_subscriptions").insert({
                            "user_id": current_user,
                            "tier": "studio",
                            "images_generated": 0,
                            "videos_generated": 0,
                            "is_tester": False
                        }).execute()
                except Exception as e:
                    print(f"Error updating subscription: {e}")
            return {"status": "success", "message": "Payment verified successfully, tier upgraded"}
        else:
            raise HTTPException(status_code=400, detail="Signature mismatch")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/me")
async def get_my_subscription(current_user: str = Depends(verify_token)):
    """Fetch the user's subscription details directly from the backend to bypass RLS issues."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
        
    try:
        res = supabase.table("user_subscriptions").select("*").eq("user_id", current_user).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]
        else:
            return {"tier": "free", "is_tester": False, "images_generated": 0, "videos_generated": 0}
    except Exception as e:
        print(f"Error fetching subscription: {e}")
        return {"tier": "free", "is_tester": False, "images_generated": 0, "videos_generated": 0}
