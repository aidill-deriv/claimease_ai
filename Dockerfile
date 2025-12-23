FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY config/requirements.txt config/requirements.txt
RUN pip install --no-cache-dir -r config/requirements.txt

# Copy application code
COPY src/ src/
COPY knowledge_base/ knowledge_base/
COPY config/ config/

# Create logs directory
RUN mkdir -p logs

# Cloud Run provides PORT via environment variable
ENV PORT=8080
ENV PYTHONUNBUFFERED=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

# Start FastAPI server
# Use exec form to properly handle signals
CMD ["sh", "-c", "uvicorn src.api:app --host 0.0.0.0 --port ${PORT} --workers 1"]

