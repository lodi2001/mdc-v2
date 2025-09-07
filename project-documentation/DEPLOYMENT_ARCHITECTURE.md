# Deployment Architecture - MDC Transaction Tracking System

## Deployment Overview

Production-ready deployment using Docker containers with automated CI/CD pipeline.

## Infrastructure Architecture

```
┌──────────────────────────────────────┐
│         CloudFlare CDN               │
│      (DDoS Protection, SSL)          │
└─────────────┬────────────────────────┘
              │
┌─────────────▼────────────────────────┐
│         Load Balancer                │
│         (Nginx/HAProxy)              │
└──────┬──────────────────┬────────────┘
       │                  │
┌──────▼──────┐    ┌─────▼──────┐
│  Web Server │    │ Web Server  │
│  (Nginx)    │    │  (Nginx)    │
└──────┬──────┘    └─────┬──────┘
       │                  │
┌──────▼──────┐    ┌─────▼──────┐
│Django App 1 │    │Django App 2 │
│ (Gunicorn)  │    │ (Gunicorn) │
└──────┬──────┘    └─────┬──────┘
       │                  │
       └────────┬─────────┘
                │
    ┌───────────┼───────────┐
    │           │           │
┌───▼───┐  ┌───▼───┐  ┌───▼───┐
│PostgreSQL││ Redis │  │Celery │
└─────────┘ └───────┘  └───────┘
```

## Docker Configuration

### Docker Compose Production
```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
      - static_volume:/app/static
      - media_volume:/app/media
    depends_on:
      - backend
      - frontend

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    volumes:
      - frontend_build:/app/build
    environment:
      - REACT_APP_API_URL=${API_URL}

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    command: gunicorn config.wsgi:application --bind 0.0.0.0:8000
    volumes:
      - static_volume:/app/static
      - media_volume:/app/media
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      - db
      - redis

  db:
    image: postgres:14-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=${DB_NAME}
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  celery:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    command: celery -A config worker -l info
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - db
      - redis

  celery-beat:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    command: celery -A config beat -l info
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - db
      - redis

volumes:
  postgres_data:
  redis_data:
  static_volume:
  media_volume:
  frontend_build:
```

### Backend Dockerfile
```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Collect static files
RUN python manage.py collectstatic --noinput

# Run as non-root user
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
```

### Frontend Dockerfile
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY . .

# Build application
RUN npm run build

# Production image
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

## CI/CD Pipeline

### GitHub Actions Workflow
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-cov
      
      - name: Run tests
        run: |
          pytest --cov=./ --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Log in to registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /app/mdc-tts
            docker-compose pull
            docker-compose up -d
```

## Environment Configuration

### Environment Variables
```bash
# .env.production
NODE_ENV=production
DJANGO_SETTINGS_MODULE=config.settings.production

# Database
DATABASE_URL=postgresql://user:pass@db:5432/mdc_tts
REDIS_URL=redis://redis:6379/0

# Security
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=api.mdc-tts.com

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=notifications@mdc-sa.com
EMAIL_HOST_PASSWORD=your-password

# Storage
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_STORAGE_BUCKET_NAME=mdc-tts-files

# OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
```

## Nginx Configuration

```nginx
upstream backend {
    server backend:8000;
}

server {
    listen 80;
    server_name api.mdc-tts.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.mdc-tts.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # Security headers
    add_header X-Frame-Options "DENY";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";

    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /app/static/;
    }

    location /media/ {
        alias /app/media/;
    }
}
```

## Monitoring & Logging

### Monitoring Stack
- **Application Monitoring**: Sentry
- **Infrastructure Monitoring**: Prometheus + Grafana
- **Log Management**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Uptime Monitoring**: UptimeRobot

### Health Checks
```python
# health_check.py
def health_check(request):
    checks = {
        'database': check_database(),
        'redis': check_redis(),
        'storage': check_storage(),
    }
    
    status = all(checks.values())
    return JsonResponse({
        'status': 'healthy' if status else 'unhealthy',
        'checks': checks,
        'timestamp': timezone.now()
    }, status=200 if status else 503)
```

## Backup Strategy

### Database Backup
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Database backup
pg_dump $DATABASE_URL > $BACKUP_DIR/db_$DATE.sql

# Compress
gzip $BACKUP_DIR/db_$DATE.sql

# Upload to S3
aws s3 cp $BACKUP_DIR/db_$DATE.sql.gz s3://mdc-backups/

# Clean old backups
find $BACKUP_DIR -mtime +30 -delete
```

### Backup Schedule
- **Database**: Daily at 2 AM
- **Media Files**: Daily incremental
- **Configuration**: On change
- **Retention**: 30 days

## Scaling Strategy

### Horizontal Scaling
```yaml
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mdc-tts-backend
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
```

### Auto-Scaling Rules
- CPU > 70%: Scale up
- Memory > 80%: Scale up
- Request rate > 1000/min: Scale up
- Minimum instances: 2
- Maximum instances: 10

## Security Hardening

### Production Security Checklist
- [ ] SSL certificates configured
- [ ] Security headers enabled
- [ ] Firewall rules configured
- [ ] Database encrypted
- [ ] Secrets in vault
- [ ] Rate limiting enabled
- [ ] DDoS protection active
- [ ] Monitoring alerts configured

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Security scan completed
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Backup verified

### Deployment Steps
1. Tag release in Git
2. Build Docker images
3. Run database migrations
4. Deploy to staging
5. Run smoke tests
6. Deploy to production
7. Verify deployment
8. Monitor metrics

### Post-Deployment
- [ ] Health checks passing
- [ ] Monitoring active
- [ ] Logs accessible
- [ ] Performance normal
- [ ] Users notified

---

*Document Version: 1.0*  
*Last Updated: January 2024*  
*MDC Transaction Tracking System*
