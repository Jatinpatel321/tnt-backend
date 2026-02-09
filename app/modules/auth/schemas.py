from pydantic import BaseModel

class LoginRequest(BaseModel):
    phone: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
