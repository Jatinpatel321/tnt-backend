from pydantic import BaseModel


class OrderItemCreate(BaseModel):
    menu_item_id: int
    quantity: int


class OrderItemResponse(BaseModel):
    menu_item_id: int
    quantity: int
    price_at_time: int

    class Config:
        from_attributes = True


class OrderItemDetailResponse(BaseModel):
    name: str
    image_url: str
    quantity: int
    price_at_time: int
    line_total: int
