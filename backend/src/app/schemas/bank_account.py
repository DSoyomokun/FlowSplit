from datetime import datetime

from pydantic import BaseModel, Field


class BankAccountCreate(BaseModel):
    plaid_item_id: str
    plaid_account_id: str
    plaid_access_token: str
    institution_id: str | None = None
    institution_name: str | None = None
    name: str = Field(..., max_length=255)
    official_name: str | None = None
    type: str = Field(..., max_length=50)
    subtype: str | None = None
    mask: str | None = None


class BankAccountUpdate(BaseModel):
    name: str | None = Field(None, max_length=255)
    is_primary: bool | None = None


class BankAccountResponse(BaseModel):
    id: str
    user_id: str
    institution_id: str | None
    institution_name: str | None
    name: str
    official_name: str | None
    type: str
    subtype: str | None
    mask: str | None
    is_primary: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class LinkTokenRequest(BaseModel):
    redirect_uri: str | None = None


class LinkTokenResponse(BaseModel):
    link_token: str
    expiration: datetime


class PublicTokenExchangeRequest(BaseModel):
    public_token: str
    institution_id: str | None = None
    institution_name: str | None = None
