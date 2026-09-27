# 📝 在线考试与题库管理系统

基于 **FastAPI + Vue 3 + TypeScript** 的前后端分离在线考试平台，支持题库管理、智能组卷、在线考试、自动评分、成绩统计与证书发放。

## ✨ 功能特性

### 题库管理
- 6 种题型：单选、多选、判断、填空、简答、编程
- 科目 / 知识点树 / 标签体系
- 难度分级（1-5）、区分度统计
- 单题 / 批量导入

### 智能组卷
- 按 **知识点权重** 分配题目
- 按 **难度分布** 抽取题目
- 按 **题型分布** 约束题数
- 自动校验总分并给出告警

### 考试与答题
- 考试生命周期：草稿 → 发布 → 结束
- 题目乱序、选项乱序
- 限时考试 + 倒计时自动交卷
- **防作弊**：切屏检测（超限警告 / 强制交卷）、答题用时异常检测、同 IP 多账号检测

### 自动评分
- 单选 / 判断：自动比对
- 多选：全对满分、漏选部分分、错选零分
- 填空：多标准答案匹配
- 简答：关键词命中率给分
- 编程：标记待人工评测

### 成绩统计
- 考试整体统计（平均分、及格率、分数分布）
- 单题统计（正确率、实际难度、区分度）
- 排名与百分位、排行榜
- 通过考试自动生成证书

## 🚀 快速开始

### 环境要求
- Python 3.10+
- Node.js 18+

### 安装

```bash
# 1. 安装后端依赖
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 2. 安装前端依赖（frontend/ 与根目录 concurrently）
npm install && npm run setup

# 3. 初始化数据库（含示例数据：4 用户、1 科目、6 知识点、24 题、1 场已发布考试）
python scripts/init_db.py
```

### 一键启动（前后端同时启动）

```bash
npm run dev
```

- 前端（Vite 开发服务器）：http://127.0.0.1:5173 （`/api` 请求自动代理到后端）
- 后端（FastAPI）：http://127.0.0.1:8000 （接口文档：http://127.0.0.1:8000/docs）

也可以分开启动：

```bash
npm run dev:backend     # 仅启动后端
npm run dev:frontend    # 仅启动前端
```

### 生产模式

```bash
npm run build           # 构建前端到 frontend/dist
npm start               # FastAPI 同时托管 API 与前端静态页面
```

访问 http://127.0.0.1:8000

### 示例账号

| 角色 | 账号 | 密码 |
|------|------|------|
| 管理员 | admin | 123456 |
| 教师 | teacher | 123456 |
| 学生 | student1 / student2 | 123456 |

## 🧪 运行测试

```bash
pytest tests/ -v
```

测试覆盖：多选评分、超时判定、分页、排名统计、防作弊计数、智能组卷知识点覆盖。

## 📁 目录结构

```
exam_system/
├── app/                     # FastAPI 后端
│   ├── main.py              # 入口：API 路由 + 托管前端构建产物
│   ├── core/                # 配置 / 数据库 / 安全 / 依赖
│   ├── models/              # SQLAlchemy 模型（10 张表）
│   ├── schemas/             # Pydantic 校验
│   ├── services/            # 业务逻辑（组卷 / 评分 / 统计 / 防作弊）
│   ├── api/                 # REST 接口
│   └── utils/
├── frontend/                # Vue 3 + TypeScript 前端（Vite）
│   ├── src/
│   │   ├── api/             # 类型化 API 封装（fetch）
│   │   ├── stores/          # Pinia 状态（登录态）
│   │   ├── router/          # Vue Router + 登录守卫
│   │   ├── views/           # 登录/仪表盘/题库/考试/答题/结果/统计
│   │   ├── components/      # 弹窗、分页等通用组件
│   │   └── types/           # 与后端 Schema 对应的 TS 类型
│   └── vite.config.ts       # /api 代理到 8000 端口
├── scripts/init_db.py       # 初始化脚本
├── tests/                   # 单元测试
├── package.json             # npm run dev 一键启动前后端
└── data/                    # SQLite 数据库文件
```

## 🔌 主要 API

| 模块 | 接口 |
|------|------|
| 认证 | `POST /api/auth/login` |
| 题库 | `GET/POST /api/questions`、`/api/questions/subjects`、`/api/questions/knowledge-points`、`/api/questions/tags` |
| 考试 | `GET/POST /api/exams`、`POST /api/exams/papers/smart-generate` |
| 答题 | `POST /api/attempts/{exam_id}/start`、`POST /api/attempts/{attempt_id}/submit`、`GET /api/attempts/{attempt_id}/result`、`POST /api/attempts/{attempt_id}/screen-switch` |
| 统计 | `GET /api/grades/stats/{exam_id}`、`/api/grades/rank/{exam_id}`、`/api/grades/leaderboard/{exam_id}`、`/api/grades/certificates` |

完整接口文档：启动后访问 `http://127.0.0.1:8000/docs`（Swagger UI）。

## 🛠 技术栈

- **后端**: FastAPI / SQLAlchemy 2.0 / Pydantic v2 / python-jose / passlib
- **前端**: Vue 3 / TypeScript / Vite / Vue Router / Pinia
- **数据库**: SQLite
- **开发工具**: concurrently（一键启动前后端）
