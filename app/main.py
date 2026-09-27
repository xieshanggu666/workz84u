from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import Base, engine
from app.models import *  # noqa: F401,F403 确保模型注册

from app.api import auth, users, questions, exams, attempts, grades

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"


@asynccontextmanager
async def lifespan(app: FastAPI):
    import os
    data_dir = BASE_DIR / "data"
    os.makedirs(data_dir, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

# 开发环境：Vite 已配置 /api 代理，CORS 仅作为前端直连后端时的兜底
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(users.router, prefix=settings.API_PREFIX)
app.include_router(questions.router, prefix=settings.API_PREFIX)
app.include_router(exams.router, prefix=settings.API_PREFIX)
app.include_router(attempts.router, prefix=settings.API_PREFIX)
app.include_router(grades.router, prefix=settings.API_PREFIX)


# 生产模式：托管前端构建产物（frontend/dist），
# 所有未匹配到 API 的路径回退到 index.html，由 Vue Router 处理前端路由
if FRONTEND_DIST.is_dir():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa_entry(full_path: str):
        file = FRONTEND_DIST / full_path
        if full_path and file.is_file():
            return FileResponse(file)
        return FileResponse(FRONTEND_DIST / "index.html")
