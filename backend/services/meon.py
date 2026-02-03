"""
Meon DigiLocker Aadhaar Fetch API integration.
API docs: https://digilocker.meon.co.in

Flow:
1. Generate Token -> client_token, state
2. Generate Link (digi_url) -> url for user to open
3. User completes DigiLocker flow, redirects to callback
4. Retrieve Data (send_entire_data) -> Aadhaar data
"""
import os
import httpx
from typing import Optional

MEON_BASE_URL = os.getenv("MEON_BASE_URL", "https://digilocker.meon.co.in")
COMPANY_NAME = os.getenv("MEON_COMPANY_NAME")
SECRET_TOKEN = os.getenv("MEON_SECRET_TOKEN")
CALLBACK_URL = os.getenv("MEON_CALLBACK_URL")

# In-memory store: state -> (user_id, client_token)
# For production, use Redis or a database table with TTL
_pending_verifications: dict[str, tuple[str, str]] = {}


def _store_pending(user_id: str, client_token: str, state: str) -> None:
    _pending_verifications[state] = (user_id, client_token)


def _get_and_clear_pending(state: str) -> Optional[tuple[str, str]]:
    return _pending_verifications.pop(state, None)


async def get_client_token() -> tuple[str, str]:
    """
    Step 1: Generate Token.
    Returns (client_token, state) for use in link generation and data retrieval.
    """
    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{MEON_BASE_URL}/get_access_token",
            headers={"Content-Type": "application/json"},
            json={
                "company_name": COMPANY_NAME,
                "secret_token": SECRET_TOKEN,
            },
        )
        res.raise_for_status()
        data = res.json()
        client_token = data.get("client_token")
        state = data.get("state")
        if not client_token or not state:
            raise ValueError("Meon API did not return client_token or state")
        return client_token, state


async def generate_auth_link(user_id: str) -> str:
    """
    Step 2: Generate DigiLocker link for user to open.
    Stores (user_id, client_token) keyed by state for callback lookup.
    """
    if not CALLBACK_URL:
        raise ValueError("MEON_CALLBACK_URL must be set in environment")

    client_token, state = await get_client_token()

    _store_pending(user_id, client_token, state)

    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{MEON_BASE_URL}/digi_url",
            headers={"Content-Type": "application/json"},
            json={
                "client_token": client_token,
                "redirect_url": CALLBACK_URL,
                "company_name": COMPANY_NAME,
                "documents": "aadhaar,pan",
            },
        )
        res.raise_for_status()
        data = res.json()
        url = data.get("url")
        if not url:
            raise ValueError("Meon API did not return url")
        return url


async def retrieve_aadhaar_data(client_token: str, state: str) -> dict:
    """
    Step 4: Retrieve Aadhaar data after user completes DigiLocker flow.
    """
    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{MEON_BASE_URL}/v2/send_entire_data",
            headers={"Content-Type": "application/json"},
            json={
                "client_token": client_token,
                "state": state,
                "status": True,
            },
        )
        res.raise_for_status()
        return res.json()
