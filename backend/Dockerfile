FROM python:3.13-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8080

# Shell form so $PORT (injected by Cloud Run) is expanded at container start;
# exec replaces the shell so uvicorn receives Cloud Run's SIGTERM directly.
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}
