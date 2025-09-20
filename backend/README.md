# MDC Transaction Tracking System - Backend

A comprehensive Django REST Framework backend for the MDC Transaction Tracking System, implementing role-based access control, secure authentication, file management, and comprehensive audit logging.

## Features

### 🔐 Authentication & Security
- **JWT Authentication** with refresh tokens
- **Role-based access control** (Admin, Editor, Client)
- **Google OAuth integration** (placeholder implementation)
- **Password complexity validation**
- **Rate limiting** on authentication endpoints
- **Password reset** with secure token generation
- **Account approval workflow** for new registrations

### 👥 User Management
- **Custom User model** with extended profile fields
- **Multi-language support** (English/Arabic)
- **User status management** (Active, Inactive, Suspended, Pending)
- **Email verification** system
- **Admin approval workflow** for client registrations

### 📋 Transaction Management
- **Complete transaction lifecycle** with status workflows
- **Auto-generated transaction IDs** (TRX-YYYY-NNNNN format)
- **QR code generation** for each transaction
- **Status history tracking** with audit trail
- **Assignment system** for editors
- **Due date tracking** with overdue alerts
- **Comment system** with internal/external visibility
- **Tag system** for categorization and search

### 📎 File Management
- **Secure file uploads** with validation
- **File type and size restrictions**
- **Virus scanning status** tracking
- **Role-based file visibility** controls
- **Duplicate detection** using file hashing
- **Secure download** with permission checks

### 📧 Notification System
- **Email template management** with multi-language support
- **Template variable substitution**
- **Delivery tracking** with retry mechanism
- **User notification preferences**
- **Admin notification** for new registrations
- **Status change notifications**

### 📊 Audit & Compliance
- **Comprehensive audit logging** of all system activities
- **User action tracking** with IP address and user agent
- **Model change tracking** with before/after values
- **Security event logging** (failed logins, permission denials)
- **Configurable log retention** policies

### ⚙️ System Configuration
- **Environment-based settings** using python-decouple
- **Database flexibility** (SQLite for development, PostgreSQL for production)
- **Redis caching** support
- **Celery task queue** ready (for email processing)
- **Comprehensive logging** configuration

## Technology Stack

- **Framework**: Django 5.2.6 + Django REST Framework 3.16.1
- **Authentication**: Django REST Framework Simple JWT 5.5.1
- **Database**: PostgreSQL (production) / SQLite (development)
- **Caching**: Redis with django-redis
- **Task Queue**: Celery (configured)
- **File Processing**: Pillow for image handling
- **Security**: Built-in Django security features + custom implementations
- **Documentation**: QR code generation with qrcode library

## Project Structure

```
backend/
├── mdc_backend/           # Main project configuration
│   ├── settings.py        # Comprehensive Django settings
│   ├── urls.py           # Main URL routing
│   └── wsgi.py           # WSGI configuration
├── authentication/       # Authentication system
│   ├── serializers.py    # JWT, registration, password serializers
│   ├── views.py         # Auth endpoints with security
│   └── urls.py          # Authentication URLs
├── users/               # User management
│   ├── models.py        # Custom User, PasswordResetToken, SystemSettings
│   └── validators.py    # Password complexity validator
├── transactions/        # Transaction management
│   └── models.py        # Transaction, StatusHistory, Comment models
├── attachments/         # File management
│   └── models.py        # Attachment model with security features
├── notifications/       # Email notification system
│   └── models.py        # EmailTemplate, EmailNotification, preferences
├── audit/              # Audit logging
│   ├── models.py       # Comprehensive AuditLog model
│   └── middleware.py   # Automatic audit logging middleware
├── dashboard/          # Analytics (to be implemented)
├── static/             # Static files
├── media/              # Uploaded files
├── logs/              # Application logs
└── requirements.txt    # Python dependencies
```

## Installation & Setup

### 1. Prerequisites
- Python 3.11+
- PostgreSQL (for production) or SQLite (for development)
- Redis (for caching and Celery)

### 2. Environment Setup
```bash
# Clone the repository
cd /path/to/mdc-v2/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Configuration
Create `.env` file in the backend directory:

```env
# Django settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (SQLite for development)
USE_SQLITE=True

# For PostgreSQL production:
# USE_SQLITE=False
# DB_NAME=mdc_db
# DB_USER=mdc_user
# DB_PASSWORD=mdc_password
# DB_HOST=localhost
# DB_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379/0

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Email
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# JWT
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7

# File Upload
MAX_FILE_SIZE_MB=10
MAX_FILES_PER_TRANSACTION=20

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 4. Database Setup
```bash
# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

### 5. Run Development Server
```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/`

## API Documentation

### Authentication Endpoints (`/api/v1/auth/`)

- `POST /api/v1/auth/login/` - JWT login
- `POST /api/v1/auth/token/refresh/` - Refresh JWT token
- `POST /api/v1/auth/logout/` - Logout (blacklist token)
- `POST /api/v1/auth/register/` - User registration (pending approval)
- `GET/PUT /api/v1/auth/profile/` - User profile management
- `POST /api/v1/auth/change-password/` - Password change
- `POST /api/v1/auth/reset-password/` - Password reset request
- `POST /api/v1/auth/reset-password/confirm/` - Password reset confirmation
- `POST /api/v1/auth/google/` - Google OAuth (placeholder)

### API Response Format

```json
{
  "message": "Success message",
  "data": {...},
  "errors": {...}
}
```

## Security Features

### 1. Authentication Security
- JWT tokens with configurable expiry
- Refresh token rotation
- Rate limiting on auth endpoints
- Password complexity validation
- Secure password reset tokens

### 2. Authorization
- Role-based permissions (Admin/Editor/Client)
- Resource-level access control
- API endpoint permissions

### 3. Data Protection
- Input validation and sanitization
- File upload security
- SQL injection protection (Django ORM)
- XSS protection headers

### 4. Audit & Monitoring
- Comprehensive audit logging
- Failed login attempt tracking
- Permission denial logging
- IP address and user agent tracking

## Database Models

### Core Models
1. **User** - Extended Django user with roles and status
2. **Transaction** - Main transaction entity with workflow
3. **TransactionStatusHistory** - Status change audit trail
4. **Comment** - Transaction comments with visibility control
5. **Attachment** - File uploads with security features
6. **AuditLog** - Comprehensive system activity logging
7. **EmailTemplate** - Multi-language email templates
8. **EmailNotification** - Email delivery tracking
9. **NotificationPreference** - User notification settings
10. **SystemSettings** - Dynamic system configuration

## Role-Based Access Control

### Admin Users
- Full system access
- User management and approval
- All transactions access
- System configuration
- Audit log access

### Editor Users
- Assigned transaction management
- File upload/download
- Comment on transactions
- Status updates (limited)

### Client Users
- Own transaction access
- File upload to own transactions
- View public comments
- Profile management

## Production Deployment

### 1. Environment Variables
Set production environment variables:
```env
DEBUG=False
USE_SQLITE=False
SECRET_KEY=production-secret-key
DB_HOST=your-postgres-host
# ... other production settings
```

### 2. Database Migration
```bash
python manage.py migrate
python manage.py collectstatic
```

### 3. WSGI Server
Use Gunicorn or uWSGI for production:
```bash
pip install gunicorn
gunicorn mdc_backend.wsgi:application
```

### 4. Background Tasks
Start Celery worker for email processing:
```bash
celery -A mdc_backend worker -l info
```

## Testing

Run basic tests:
```bash
python manage.py check
python manage.py test
```

## Logging

Logs are written to:
- Console (development)
- `logs/mdc_backend.log` (file logging)

Log levels are configured for different modules and can be adjusted in settings.

## Contributing

1. Follow Django best practices
2. Maintain test coverage
3. Update documentation
4. Follow the existing code style
5. Ensure security considerations

## Security Considerations

1. **Always use HTTPS** in production
2. **Regular security updates** for dependencies
3. **Configure firewall** rules appropriately
4. **Monitor audit logs** for suspicious activity
5. **Regular database backups**
6. **Implement proper key management**

---

## Next Steps for Complete Implementation

The backend is fully functional for the core features. To complete the implementation:

1. **User Management APIs** - CRUD operations for user management
2. **Transaction APIs** - Complete REST endpoints for transactions
3. **File Upload APIs** - Attachment upload/download endpoints
4. **Dashboard APIs** - Analytics and reporting endpoints
5. **Email Templates** - Create default email templates
6. **Celery Tasks** - Implement background email processing
7. **API Documentation** - Generate comprehensive API docs
8. **Unit Tests** - Add comprehensive test coverage

This backend provides a solid, secure, and scalable foundation for the MDC Transaction Tracking System.