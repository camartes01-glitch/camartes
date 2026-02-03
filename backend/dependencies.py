"""Shared dependencies for auth-protected routes."""
from fastapi import Request, HTTPException, status
import models


def get_current_user(request: Request) -> models.User:
    """Get current user from session (set by session middleware)."""
    if not hasattr(request.state, "user") or request.state.user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    return request.state.user
