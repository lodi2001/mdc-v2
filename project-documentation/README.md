# MDC Transaction Tracking System

A comprehensive Django + React transaction management system for MDC Design Consultancy.

## 🎯 Project Overview

The MDC Transaction Tracking System (TTS) is a web-based application designed to streamline financial transaction management for MDC Design Consultancy's architectural and construction projects.

### Key Features
- 🔐 Role-based access control (Client, Editor, Admin)
- 📊 Real-time transaction tracking with 10+ status states
- 📱 QR code generation and scanning
- 📧 Automated email notifications
- 📁 File attachment management
- 🌐 Multi-language support (Arabic/English)
- 📈 Advanced reporting and analytics
- 📤 Excel import/export functionality

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Docker & Docker Compose

### Local Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/mdc-sa/transaction-tracking-system.git
cd transaction-tracking-system
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start with Docker Compose**
```bash
docker-compose up -d
```

4. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/v1
- Admin Panel: http://localhost:8000/admin

### Manual Setup

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

#### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## 📁 Project Structure

```
mdc-tts/
├── backend/           # Django REST API
│   ├── apps/         # Django applications
│   ├── config/       # Project configuration
│   ├── requirements.txt
│   └── manage.py
├── frontend/         # React application
│   ├── src/         # Source code
│   ├── public/      # Static assets
│   └── package.json
├── docker/          # Docker configurations
├── docs/            # Documentation
├── scripts/         # Utility scripts
└── docker-compose.yml
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/mdc_tts
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-password

# Frontend
REACT_APP_API_URL=http://localhost:8000/api/v1
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
```

## 🧪 Testing

### Run Backend Tests
```bash
cd backend
pytest --cov=./ --cov-report=html
```

### Run Frontend Tests
```bash
cd frontend
npm test
npm run test:coverage
```

### Run E2E Tests
```bash
npm run cypress:run
```

## 📚 API Documentation

API documentation is available at:
- Swagger UI: http://localhost:8000/swagger/
- ReDoc: http://localhost:8000/redoc/

### Authentication
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

## 🚢 Deployment

### Production Deployment

1. **Build Docker images**
```bash
docker-compose -f docker-compose.prod.yml build
```

2. **Run migrations**
```bash
docker-compose -f docker-compose.prod.yml run backend python manage.py migrate
```

3. **Collect static files**
```bash
docker-compose -f docker-compose.prod.yml run backend python manage.py collectstatic --noinput
```

4. **Start services**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### CI/CD Pipeline

The project uses GitHub Actions for CI/CD:
- Automated testing on pull requests
- Docker image building
- Deployment to staging/production

## 👥 User Roles

### Client
- View own transactions
- Download reports
- View attachments

### Editor
- Create and manage transactions
- Upload attachments
- Bulk import from Excel

### Admin
- Full system access
- User management
- System configuration

## 🌍 Internationalization

The system supports:
- English (LTR)
- Arabic (RTL)

To add a new language:
```bash
# Backend
python manage.py makemessages -l ar
python manage.py compilemessages

# Frontend
npm run extract-messages
npm run compile-messages
```

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:8000/api/v1/health
```

### Metrics
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001

## 🔐 Security

### Security Features
- JWT authentication with refresh tokens
- Google OAuth integration
- Rate limiting
- SQL injection prevention
- XSS protection
- CSRF protection

### Security Headers
```nginx
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

### Code Style
- Backend: PEP 8
- Frontend: ESLint + Prettier
- Commits: Conventional Commits

## 🐛 Troubleshooting

### Common Issues

**Database connection error:**
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection string
psql $DATABASE_URL
```

**Redis connection error:**
```bash
# Check Redis is running
redis-cli ping
```

**Port already in use:**
```bash
# Find process using port
lsof -i :8000
# Kill process
kill -9 <PID>
```

## 📚 Documentation

- [API Specifications](./docs/API_SPECIFICATIONS.md)
- [Database Schema](./docs/DATABASE_SCHEMA.md)
- [Deployment Guide](./docs/DEPLOYMENT_ARCHITECTURE.md)
- [Testing Strategy](./docs/TESTING_STRATEGY.md)
- [User Stories](./docs/USER_STORIES.md)

## 📄 License

Copyright © 2024 MDC Design Consultancy. All rights reserved.

## 📞 Support

For support and questions:
- Email: support@mdc-sa.com
- Documentation: [docs.mdc-tts.com](https://docs.mdc-tts.com)
- Issue Tracker: [GitHub Issues](https://github.com/mdc-sa/tts/issues)

## 🙏 Acknowledgments

- MDC Design Consultancy team
- Open source community
- All contributors

---

**Version**: 1.0.0  
**Last Updated**: January 2024  
**Status**: Production Ready 🚀
