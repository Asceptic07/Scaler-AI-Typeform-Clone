from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.session import get_db, get_write_db

ReadDB = Annotated[Session, Depends(get_db)]
WriteDB = Annotated[Session, Depends(get_write_db, scope="function")]
