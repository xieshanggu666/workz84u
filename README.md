# 📝 在线考试与题库管理系统

基于 **FastAPI + SQLAlchemy + SQLite** 的在线考试平台，支持题库管理、智能组卷、在线考试、自动评分、成绩统计与证书发放。

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
- 依赖见 `requirements.txt`

### 安装与启动

```bash
# 1. 创建虚拟环境并安装依赖
python -m venv .venv
.venv\Scripts\activate            # Windows
# source .venv/bin/activate      # Linux/macOS
pip install -r requirements.txt

# 2. 初始化数据库（含示例数据：4 用户、1 科目、6 知识点、24 题、1 场已发布考试）
python scripts/init_db.py

# 3. 启动服务
uvicorn app.main:app --reload --port 8000
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
├── app/
│   ├── main.py              # 入口 + 页面路由
│   ├── core/                # 配置 / 数据库 / 安全 / 依赖
│   ├── models/              # SQLAlchemy 模型（10 张表）
│   ├── schemas/             # Pydantic 校验
│   ├── services/            # 业务逻辑（组卷 / 评分 / 统计 / 防作弊）
│   ├── api/                 # REST 接口
│   └── utils/
├── templates/               # Jinja2 页面（登录/仪表盘/题库/考试/答题/成绩）
├── static/                  # CSS / JS
├── scripts/init_db.py       # 初始化脚本
├── tests/                   # 单元测试
└── data/                    # SQLite 数据库文件
```

## 🔌 主要 API

| 模块 | 接口 |
|------|------|
| 认证 | `POST /api/auth/login` |
| 题库 | `GET/POST /api/questions`、`/api/questions/subjects`、`/api/questions/knowledge-points`、`/api/questions/tags` |
| 考试 | `GET/POST /api/exams`、`POST /api/exams/papers/smart-generate` |
| 答题 | `POST /api/attempts/{exam_id}/start`、`POST /api/attempts/{attempt_id}/submit`、`POST /api/attempts/{attempt_id}/screen-switch` |
| 统计 | `GET /api/grades/stats/{exam_id}`、`/api/grades/rank/{exam_id}`、`/api/grades/leaderboard/{exam_id}`、`/api/grades/certificates` |

完整接口文档：启动后访问 `http://127.0.0.1:8000/docs`（Swagger UI）。

## 🛠 技术栈

- **后端**: FastAPI / SQLAlchemy 2.0 / Pydantic v2 / python-jose / passlib
- **数据库**: SQLite
- **前端**: Jinja2 服务端渲染 + 原生 JS
