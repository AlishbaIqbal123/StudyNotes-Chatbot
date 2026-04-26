# Use official Python 3.11 slim image for minimal size
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies needed by some Python packages
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (better layer caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Cloud Run sets PORT env variable — default to 8080
ENV PORT=8080

# Expose the port
EXPOSE 8080

# Start the FastAPI server
CMD uvicorn main:app --host 0.0.0.0 --port $PORT
