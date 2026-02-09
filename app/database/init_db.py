from app.database.session import engine
from app.database.base import Base

# 🔥 FORCE IMPORT MODELS
import app.modules.users.model  # noqa
import app.modules.slots.model  # noqa
import app.modules.menu.model  # noqa
import app.modules.orders.model  # noqa
import app.modules.orders.history_model  # noqa
import app.modules.payments.model  # noqa
import app.modules.ledger.model  # noqa
import app.modules.stationery.service_model
import app.modules.stationery.job_model
import app.modules.notifications.model


def init_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
