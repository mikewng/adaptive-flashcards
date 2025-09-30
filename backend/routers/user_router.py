from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from . import models, schemas, database

router = APIRouter(prefix="/user", tags=["user"])