from pydantic import BaseModel

class AadhaarStartResponse(BaseModel):
    redirect_url: str

class AadhaarStatusResponse(BaseModel):
    verified: bool
