import os
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
from fastapi.responses import RedirectResponse

from database import get_db
from services.meon import generate_auth_link, retrieve_aadhaar_data, _get_and_clear_pending
from models import User
from dependencies import get_current_user

router = APIRouter(prefix="/aadhaar", tags=["Aadhaar"])

# Frontend redirect URL - user lands here after verification (for app deep link or web)
FRONTEND_SUCCESS_URL = os.getenv("FRONTEND_VERIFICATION_SUCCESS_URL", "")


@router.get("/start")
async def start_verification(
    current_user: User = Depends(get_current_user)
):
    """Generate DigiLocker link for Aadhaar verification."""
    auth_url = await generate_auth_link(current_user.user_id)
    return {"auth_url": auth_url}


@router.get("/callback")
async def aadhaar_callback(
    state: str = Query(..., description="State from DigiLocker redirect"),
    db: Session = Depends(get_db),
):
    """
    DigiLocker redirects here after user completes verification.
    Query params typically include: state (required for retrieve_data).
    """
    pending = _get_and_clear_pending(state)
    if not pending:
        raise HTTPException(status_code=400, detail="Invalid or expired state")

    user_id, client_token = pending

    try:
        document_data = await retrieve_aadhaar_data(client_token, state)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to retrieve Aadhaar data: {e}")

    # Validate response
    if not document_data.get("success") or document_data.get("status") != "success":
        raise HTTPException(status_code=502, detail="Aadhaar data retrieval failed")

    data = document_data.get("data", {})
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.aadhaar_verified = True
    user.aadhaar_verified_at = datetime.utcnow()
    user.aadhaar_issuer = "DigiLocker"
    db.commit()

    # Redirect to frontend success page if configured
    if FRONTEND_SUCCESS_URL:
        return RedirectResponse(url=FRONTEND_SUCCESS_URL, status_code=302)

    return {"status": "aadhaar_verified", "msg": "Verification successful"}
