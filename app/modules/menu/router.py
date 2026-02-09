from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.deps import get_db
from app.core.security import get_current_user, require_role
from app.modules.users.model import User
from app.modules.menu.model import MenuItem
from app.core.file_upload import save_menu_image

router = APIRouter(prefix="/menu", tags=["Menu"])


@router.post("/")
def add_menu_item(
    name: str = Form(...),
    price: int = Form(...),
    description: str | None = Form(None),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    require_role(user, "vendor")

    db_user = db.query(User).filter(User.phone == user["phone"]).first()

    image_url = save_menu_image(image)

    item = MenuItem(
        vendor_id=db_user.id,
        name=name,
        description=description,
        price=price,
        image_url=image_url
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return item

if not db_user.is_approved:
    raise HTTPException(status_code=403, detail="Vendor not approved")
