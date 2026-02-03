"""Auth dependencies - verify_token used by KYC and other routers."""
from fastapi import Depends
from dependencies import get_current_user
import models

# Alias for backward compatibility with routers that use verify_token
def verify_token(current_user: models.User = Depends(get_current_user)) -> models.User:
    return current_user
