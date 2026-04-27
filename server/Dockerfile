# Use Python 3.12 (standard for FastAPI)
FROM python:3.12-slim

# Create a non-root user for Hugging Face security (UID 1000)
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

# Set working directory
WORKDIR /app

# Install system dependencies (required for some python libs)
USER root
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Fix permissions
RUN chown -R user:user /app
USER user

# Copy requirements and install
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy application code
COPY --chown=user . .

# Hugging Face Spaces MUST use port 7860
EXPOSE 7860

# Start the application (main:app)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
