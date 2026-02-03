from fastapi import APIRouter, Depends
from services.meon import generate_auth_link
from auth import verify_token
from schemas.kyc import AadhaarStartResponse
import models

router = APIRouter(prefix="/kyc")


@router.post("/aadhaar/start", response_model=AadhaarStartResponse)
async def start_kyc(user: models.User = Depends(verify_token)):
    """Generate DigiLocker link for Aadhaar verification (alias for /aadhaar/start)."""
    link = await generate_auth_link(user.user_id)
    return {"redirect_url": link}
