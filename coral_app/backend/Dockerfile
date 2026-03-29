FROM python:3.11-slim

RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .
RUN pip install --no-cache-dir -r requirements.txt

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 7860

CMD nginx -g "daemon off;" & \
    uvicorn pipeline.pipeline_api:app --host 0.0.0.0 --port 8000 & \
    uvicorn model_registry.registry_api:app --host 0.0.0.0 --port 8001 & \
    wait