# Web-DeadForest

Короткий опис проекту та інструкції для швидкого запуску локально (frontend + backend).

## Prerequisites
- Node.js >= 18
- pnpm
- Python 3.11+
- pip

## Frontend (Next.js)
1. Встановити залежності: `pnpm install`
2. Запустити: `pnpm dev`

## Backend (FastAPI)
1. Перейти в папку `backend`
2. Створити віртуальне оточення: `python -m venv .venv`
3. Активувати: `source .venv/bin/activate`
4. Встановити залежності: `pip install -r requirements.txt`
5. Запустити сервер: `uvicorn backend.app.main:app --reload`

## GitHub
1. Ініціалізувати репозиторій: `git init`
2. Додати remote: `git remote add origin <url>`
3. Перший коміт та push: `git add . && git commit -m "Initial commit" && git push -u origin main`
