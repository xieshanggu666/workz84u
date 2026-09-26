from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.core.config import settings
from app.core.database import Base, engine
from app.models import *  # noqa: F401,F403 确保模型注册

from app.api import auth, users, questions, exams, attempts, grades

BASE_DIR = Path(__file__).resolve().parent.parent


@asynccontextmanager
async def lifespan(app: FastAPI):
    import os
    data_dir = BASE_DIR / "data"
    os.makedirs(data_dir, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(users.router, prefix=settings.API_PREFIX)
app.include_router(questions.router, prefix=settings.API_PREFIX)
app.include_router(exams.router, prefix=settings.API_PREFIX)
app.include_router(attempts.router, prefix=settings.API_PREFIX)
app.include_router(grades.router, prefix=settings.API_PREFIX)


def _is_authenticated(request: Request) -> bool:
    token = request.cookies.get("access_token")
    if not token:
        return False
    from app.core.security import decode_token
    return decode_token(token) is not None


@app.get("/", response_class=HTMLResponse)
def index(request: Request):
    if not _is_authenticated(request):
        return RedirectResponse(url="/login")
    return templates.TemplateResponse(request, "dashboard.html")


@app.get("/login", response_class=HTMLResponse)
def login_page(request: Request):
    return templates.TemplateResponse(request, "login.html")


@app.get("/questions", response_class=HTMLResponse)
def questions_page(request: Request):
    if not _is_authenticated(request):
        return RedirectResponse(url="/login")
    return templates.TemplateResponse(request, "questions.html")


@app.get("/exams", response_class=HTMLResponse)
def exams_page(request: Request):
    if not _is_authenticated(request):
        return RedirectResponse(url="/login")
    return templates.TemplateResponse(request, "exams.html")


@app.get("/exam/{exam_id}/take", response_class=HTMLResponse)
def exam_take_page(request: Request, exam_id: int):
    if not _is_authenticated(request):
        return RedirectResponse(url="/login")
    return templates.TemplateResponse(request, "exam_take.html", {"exam_id": exam_id})


@app.get("/result/{attempt_id}", response_class=HTMLResponse)
def exam_result_page(request: Request, attempt_id: int):
    if not _is_authenticated(request):
        return RedirectResponse(url="/login")
    return templates.TemplateResponse(request, "exam_result.html", {"attempt_id": attempt_id})
