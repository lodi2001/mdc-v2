#!/bin/bash

# Create API_SPECIFICATIONS.md
cat > API_SPECIFICATIONS.md << 'EOF'
# API Specifications - MDC Transaction Tracking System

## API Overview

RESTful API built with Django REST Framework providing all backend services for the MDC Transaction Tracking System.

## Base URL
```
Development: http://localhost:8000/api/v1
Production: https://api.mdc-tts.com/api/v1
```

## Authentication

### JWT Authentication
All API requests require JWT authentication except login endpoints.

```http
Authorization: Bearer <jwt_token>
```

### Token Lifecycle
- Access Token: 24 hours
- Refresh Token: 7 days
- Token refresh required before expiry

## API Endpoints

### Authentication Endpoints

#### POST /auth/login
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "role": "editor",
      "first_name": "John",
      "last_name": "Doe"
    }
  }
}
```

#### POST /auth/google
Google OAuth authentication.

**Request:**
```json
{
  "id_token": "google_oauth_id_token"
}
```

#### POST /auth/refresh
Refresh access token.

**Request:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

#### POST /auth/logout
Logout and invalidate tokens.

#### POST /auth/password-reset
Request password reset.

**Request:**
```json
{
  "email": "user@example.com"
}
```

#### POST /auth/password-reset/confirm
Confirm password reset.

**Request:**
```json
{
  "token": "reset_token",
  "new_password": "NewSecurePass123!"
}
```

### Transaction Endpoints

#### GET /transactions
Get paginated list of transactions.

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `page_size` (int): Items per page (default: 20, max: 100)
- `status` (string): Filter by status
- `search` (string): Search in title/description
- `created_after` (date): Filter by creation date
- `created_before` (date): Filter by creation date
- `assigned_to` (uuid): Filter by assigned user
- `sort` (string): Sort field (default: -created_at)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "TRX-2024-00001",
        "title": "Project Payment",
        "amount": 50000.00,
        "currency": "SAR",
        "status": "in_progress",
        "created_at": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "count": 150,
      "page": 1,
      "page_size": 20,
      "total_pages": 8
    }
  }
}
```

#### GET /transactions/{id}
Get single transaction details.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "TRX-2024-00001",
    "title": "Project Payment",
    "description": "Monthly payment for construction project",
    "amount": 50000.00,
    "currency": "SAR",
    "status": "in_progress",
    "priority": "high",
    "category": "construction",
    "project_id": "PRJ-2024-015",
    "qr_code": "data:image/png;base64,...",
    "created_by": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe"
    },
    "assigned_to": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Jane Smith"
    },
    "attachments": [],
    "status_history": [],
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-16T14:30:00Z",
    "due_date": "2024-02-01"
  }
}
```

#### POST /transactions
Create new transaction.

**Request:**
```json
{
  "title": "New Project Payment",
  "description": "Payment for phase 1",
  "amount": 75000.00,
  "currency": "SAR",
  "category": "construction",
  "priority": "normal",
  "due_date": "2024-02-15",
  "assigned_to": "550e8400-e29b-41d4-a716-446655440001"
}
```

#### PUT /transactions/{id}
Update transaction.

#### DELETE /transactions/{id}
Delete transaction (admin only).

#### POST /transactions/{id}/status
Update transaction status.

**Request:**
```json
{
  "status": "approved",
  "comment": "Approved by management"
}
```

#### POST /transactions/bulk-import
Import transactions from Excel.

**Request:** Multipart form data with Excel file

**Response (200):**
```json
{
  "success": true,
  "data": {
    "imported": 45,
    "failed": 5,
    "errors": [
      {
        "row": 23,
        "error": "Invalid amount format"
      }
    ]
  }
}
```

#### GET /transactions/export
Export transactions to Excel/PDF.

**Query Parameters:**
- `format`: excel or pdf
- `start_date`: Filter start date
- `end_date`: Filter end date

### Attachment Endpoints

#### POST /transactions/{id}/attachments
Upload file attachment.

**Request:** Multipart form data

#### GET /attachments/{id}
Download attachment.

#### DELETE /attachments/{id}
Delete attachment.

### User Management Endpoints (Admin)

#### GET /users
Get list of users.

#### POST /users
Create new user.

#### PUT /users/{id}
Update user details.

#### DELETE /users/{id}
Delete user.

#### POST /users/{id}/reset-password
Send password reset email.

### Report Endpoints

#### GET /reports/dashboard
Get dashboard statistics.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total_transactions": 1250,
      "pending_transactions": 45,
      "total_amount": 5750000.00,
      "overdue_count": 8
    },
    "charts": {
      "status_distribution": {},
      "monthly_trend": {},
      "category_breakdown": {}
    }
  }
}
```

#### GET /reports/transactions
Generate transaction report.

#### GET /reports/audit-logs
Get audit logs (admin only).

## Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "amount": ["Amount must be positive"]
    }
  }
}
```

### Error Codes
- `AUTHENTICATION_REQUIRED`: 401
- `PERMISSION_DENIED`: 403
- `NOT_FOUND`: 404
- `VALIDATION_ERROR`: 400
- `SERVER_ERROR`: 500
- `RATE_LIMITED`: 429

## Rate Limiting

- Anonymous: 20 requests/minute
- Authenticated: 100 requests/minute
- Bulk operations: 10 requests/minute

## Pagination

All list endpoints support pagination:
```json
{
  "pagination": {
    "count": 150,
    "page": 1,
    "page_size": 20,
    "total_pages": 8,
    "next": "/api/v1/transactions?page=2",
    "previous": null
  }
}
```

## Filtering & Sorting

### Filter Operators
- `exact`: Exact match
- `contains`: Contains substring
- `gt`: Greater than
- `gte`: Greater than or equal
- `lt`: Less than
- `lte`: Less than or equal
- `in`: In list

### Sort Options
- Prefix with `-` for descending order
- Example: `?sort=-created_at,title`

## Webhooks

### Webhook Events
- `transaction.created`
- `transaction.status_changed`
- `transaction.completed`
- `payment.received`

### Webhook Payload
```json
{
  "event": "transaction.status_changed",
  "data": {},
  "timestamp": "2024-01-15T10:00:00Z",
  "signature": "hmac_sha256_signature"
}
```

## API Versioning

Version specified in URL path:
- Current: `/api/v1/`
- Legacy support: 6 months

## SDK Support

### Python SDK
```python
from mdc_tts import Client

client = Client(api_key="your_api_key")
transactions = client.transactions.list()
```

### JavaScript SDK
```javascript
import { MDCClient } from 'mdc-tts-sdk';

const client = new MDCClient({ apiKey: 'your_api_key' });
const transactions = await client.transactions.list();
```

---

*Document Version: 1.0*  
*Last Updated: January 2024*  
*MDC Transaction Tracking System*
EOF
echo "Created API_SPECIFICATIONS.md"

# Create SECURITY_SPECIFICATIONS.md
cat > SECURITY_SPECIFICATIONS.md << 'EOF'
# Security Specifications - MDC Transaction Tracking System

## Security Overview

Comprehensive security implementation following industry best practices and compliance requirements.

## Authentication & Authorization

### Authentication Methods

#### JWT Authentication
- Algorithm: RS256 (RSA Signature with SHA-256)
- Token expiry: 24 hours
- Refresh token: 7 days
- Token storage: HttpOnly cookies + localStorage
- Token rotation on refresh

#### Google OAuth 2.0
- OAuth flow: Authorization Code with PKCE
- Scopes: email, profile
- Token validation: Google API verification
- Account linking for existing users

### Password Policy
- Minimum length: 8 characters
- Required: uppercase, lowercase, number, special character
- Password history: Last 5 passwords
- Password expiry: 90 days (configurable)
- Account lockout: 5 failed attempts (30 minutes)

### Multi-Factor Authentication (MFA)
- TOTP (Time-based One-Time Password)
- SMS backup codes
- Recovery codes (10 single-use)

## Role-Based Access Control (RBAC)

### Permission Model
```python
PERMISSIONS = {
    'client': [
        'view_own_transactions',
        'download_own_reports',
        'view_own_attachments'
    ],
    'editor': [
        'create_transaction',
        'edit_assigned_transactions',
        'upload_attachments',
        'bulk_import'
    ],
    'admin': [
        '*'  # All permissions
    ]
}
```

### API Permission Decorators
```python
@permission_required('edit_transaction')
@role_required(['editor', 'admin'])
def update_transaction(request, id):
    pass
```

## Data Security

### Encryption at Rest
- Database: AES-256 encryption
- File storage: AES-256 encryption
- Encryption keys: AWS KMS / HashiCorp Vault
- Key rotation: Every 90 days

### Encryption in Transit
- Protocol: TLS 1.3 minimum
- Cipher suites: ECDHE-RSA-AES256-GCM-SHA384
- Certificate: Extended Validation (EV) SSL
- HSTS: max-age=31536000; includeSubDomains

### Sensitive Data Handling
- PII masking in logs
- Credit card tokenization
- Password hashing: bcrypt (cost factor 12)
- API key hashing: SHA-256

## Application Security

### Input Validation
```python
VALIDATION_RULES = {
    'email': r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    'amount': r'^\d+(\.\d{1,2})?$',
    'transaction_id': r'^TRX-\d{4}-\d{5}$'
}
```

### SQL Injection Prevention
- Parameterized queries only
- ORM usage (Django ORM)
- Input sanitization
- Stored procedure validation

### XSS Prevention
- Content Security Policy (CSP)
- Output encoding
- React's automatic escaping
- Template auto-escaping

### CSRF Protection
- CSRF tokens for all forms
- SameSite cookie attribute
- Double submit cookie pattern
- Custom headers validation

## API Security

### Rate Limiting
```python
RATE_LIMITS = {
    'login': '5/minute',
    'password_reset': '3/hour',
    'api_default': '100/minute',
    'bulk_operations': '10/minute'
}
```

### API Key Management
- Key generation: 32 bytes random
- Key rotation: Every 180 days
- Key scoping: Per environment
- Key revocation: Immediate

### Request Signing
```python
signature = hmac.new(
    secret_key.encode(),
    f"{method}{path}{timestamp}{body}".encode(),
    hashlib.sha256
).hexdigest()
```

## Infrastructure Security

### Network Security
- VPC isolation
- Private subnets for database
- Security groups (minimal ports)
- WAF rules for common attacks
- DDoS protection (CloudFlare)

### Container Security
```dockerfile
# Run as non-root user
USER appuser

# No unnecessary packages
RUN apt-get purge -y --auto-remove \
    && rm -rf /var/lib/apt/lists/*

# Security scanning
RUN trivy filesystem --no-progress /app
```

### Secrets Management
- Environment variables for config
- Secrets in HashiCorp Vault
- No hardcoded credentials
- Automatic secret rotation

## Security Headers

```python
SECURITY_HEADERS = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000',
    'Content-Security-Policy': "default-src 'self'",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=()'
}
```

## Audit & Logging

### Security Events Logged
- Authentication attempts
- Authorization failures
- Data access/modifications
- Configuration changes
- Security exceptions
- API key usage

### Log Format
```json
{
  "timestamp": "2024-01-15T10:00:00Z",
  "level": "WARNING",
  "event": "failed_login",
  "user": "user@example.com",
  "ip": "192.168.1.1",
  "details": {
    "attempts": 3,
    "reason": "invalid_password"
  }
}
```

### Log Security
- No sensitive data in logs
- Log encryption at rest
- Log retention: 90 days
- Centralized logging (ELK stack)
- Real-time alerting

## Vulnerability Management

### Dependency Scanning
- Daily vulnerability scans
- Automated dependency updates
- OWASP dependency check
- Container image scanning

### Security Testing
- Static analysis (SAST)
- Dynamic analysis (DAST)
- Penetration testing (quarterly)
- Security code reviews

### Common Vulnerabilities Prevention

#### OWASP Top 10 Mitigation
1. **Injection**: Parameterized queries
2. **Broken Authentication**: MFA, secure sessions
3. **Sensitive Data Exposure**: Encryption
4. **XML External Entities**: Disable XXE
5. **Broken Access Control**: RBAC
6. **Security Misconfiguration**: Hardening
7. **XSS**: CSP, output encoding
8. **Insecure Deserialization**: Input validation
9. **Vulnerable Components**: Dependency scanning
10. **Insufficient Logging**: Comprehensive audit

## Compliance & Standards

### Standards Compliance
- ISO 27001 guidelines
- OWASP ASVS Level 2
- PCI DSS (if payment processing)
- GDPR (data protection)

### Security Policies
- Data classification policy
- Incident response plan
- Disaster recovery plan
- Security training requirements

## Incident Response

### Response Plan
1. **Detection**: Monitoring alerts
2. **Analysis**: Severity assessment
3. **Containment**: Isolate affected systems
4. **Eradication**: Remove threat
5. **Recovery**: Restore services
6. **Lessons Learned**: Post-mortem

### Contact Information
- Security Team: security@mdc-sa.com
- Incident Hotline: +966-XXX-XXXX
- External Support: [Security Vendor]

## Security Checklist

### Pre-Deployment
- [ ] Security code review completed
- [ ] Vulnerability scan passed
- [ ] Penetration test conducted
- [ ] SSL certificates valid
- [ ] Secrets properly managed
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Audit logging active

### Post-Deployment
- [ ] Security monitoring active
- [ ] Incident response team ready
- [ ] Backup encryption verified
- [ ] Access logs reviewed
- [ ] Security patches applied

---

*Document Version: 1.0*  
*Last Updated: January 2024*  
*MDC Transaction Tracking System*
EOF
echo "Created SECURITY_SPECIFICATIONS.md"

# Create IMPLEMENTATION_ROADMAP.md
cat > IMPLEMENTATION_ROADMAP.md << 'EOF'
# Implementation Roadmap - MDC Transaction Tracking System

## Project Timeline Overview

**Duration**: 30 days (4 weeks)  
**Total Hours**: 308 hours  
**Start Date**: [Project Start]  
**End Date**: [Project Start + 30 days]  

## Team Structure

| Role | Allocation | Hours/Week | Total Hours |
|------|------------|------------|-------------|
| Full-Stack Developer | 100% | 40 | 160 |
| Backend Developer | 75% | 30 | 120 |
| QA Engineer | 25% | 10 | 40 |
| DevOps Engineer | 25% | 10 | 40 |

## Week 1: Foundation & Setup (Days 1-7) - 77 Hours

### Day 1-2: Project Setup (16 hours)

#### Backend Tasks
- [ ] Initialize Django project
- [ ] Set up PostgreSQL database
- [ ] Configure Redis cache
- [ ] Set up project structure
- [ ] Configure environment variables
- [ ] Initialize Git repository

#### Frontend Tasks
- [ ] Create React application
- [ ] Set up TypeScript configuration
- [ ] Install core dependencies
- [ ] Configure Bootstrap 5
- [ ] Set up folder structure
- [ ] Configure ESLint/Prettier

### Day 3-4: Authentication System (16 hours)

#### Backend Implementation
- [ ] Create User model
- [ ] Implement JWT authentication
- [ ] Set up Google OAuth
- [ ] Create authentication endpoints
- [ ] Implement password reset flow
- [ ] Add session management

#### Frontend Implementation
- [ ] Create login page
- [ ] Implement Google OAuth button
- [ ] Build password reset form
- [ ] Add authentication context
- [ ] Implement protected routes
- [ ] Create logout functionality

### Day 5-7: Core Models & APIs (45 hours)

#### Database Design
- [ ] Create all database tables
- [ ] Set up migrations
- [ ] Add indexes
- [ ] Create database views
- [ ] Implement triggers

#### API Development
- [ ] Transaction CRUD endpoints
- [ ] User management endpoints
- [ ] Serializers creation
- [ ] Permission classes
- [ ] API documentation

#### Frontend Foundation
- [ ] API service layer
- [ ] Basic layout components
- [ ] Navigation setup
- [ ] Dashboard skeleton
- [ ] Error handling

### Week 1 Deliverables
✅ Authentication system functional  
✅ Database schema implemented  
✅ Basic API endpoints working  
✅ Frontend project structure ready  

## Week 2: Core Features (Days 8-14) - 77 Hours

### Day 8-9: File Management (16 hours)

#### Backend
- [ ] File upload endpoint
- [ ] File storage configuration
- [ ] Virus scanning integration
- [ ] File download endpoint
- [ ] File deletion logic

#### Frontend
- [ ] File upload component
- [ ] Drag-and-drop interface
- [ ] File preview functionality
- [ ] Download implementation
- [ ] Progress indicators

### Day 10-11: QR Code System (16 hours)

#### Implementation
- [ ] QR code generation library
- [ ] QR code model field
- [ ] QR code API endpoint
- [ ] Frontend QR display
- [ ] QR code scanning
- [ ] Mobile optimization

### Day 12-14: Permissions & Audit (45 hours)

#### RBAC Implementation
- [ ] Role-based permissions
- [ ] Permission decorators
- [ ] Access control tests
- [ ] Frontend permission checks
- [ ] Role management UI

#### Audit System
- [ ] Audit log model
- [ ] Audit middleware
- [ ] Log all actions
- [ ] Audit viewer UI
- [ ] Export audit logs

### Week 2 Deliverables
✅ File management operational  
✅ QR codes generating  
✅ RBAC fully implemented  
✅ Audit logging active  

## Week 3: Advanced Features (Days 15-21) - 77 Hours

### Day 15-16: Email Notifications (16 hours)

#### Email System
- [ ] Email queue model
- [ ] Email templates
- [ ] SMTP configuration
- [ ] Celery setup
- [ ] Email triggers
- [ ] Template editor UI

### Day 17-18: Import/Export (16 hours)

#### Excel Integration
- [ ] Excel parser
- [ ] Import validation
- [ ] Bulk import endpoint
- [ ] Export functionality
- [ ] Template generation
- [ ] Import preview UI

### Day 19-21: Dashboard & Reports (45 hours)

#### Analytics Implementation
- [ ] Dashboard statistics
- [ ] Chart generation
- [ ] Report templates
- [ ] PDF generation
- [ ] Export options
- [ ] Interactive dashboards

### Week 3 Deliverables
✅ Email notifications working  
✅ Import/Export functional  
✅ Dashboards complete  
✅ Reporting system ready  

## Week 4: Polish & Deployment (Days 22-30) - 77 Hours

### Day 22-23: Internationalization (16 hours)

#### Multi-language Support
- [ ] i18n backend setup
- [ ] Translation files
- [ ] React i18n integration
- [ ] RTL support
- [ ] Language switcher
- [ ] Date/number formatting

### Day 24-25: Frontend Polish (16 hours)

#### UI/UX Improvements
- [ ] Responsive design fixes
- [ ] Loading states
- [ ] Error messages
- [ ] Form validations
- [ ] Animations
- [ ] Accessibility

### Day 26-27: Testing (16 hours)

#### Test Implementation
- [ ] Unit tests (40%)
- [ ] Integration tests (25%)
- [ ] E2E tests (15%)
- [ ] Performance tests
- [ ] Security tests
- [ ] Bug fixes

### Day 28-30: Deployment (29 hours)

#### DevOps Tasks
- [ ] Docker configuration
- [ ] Docker Compose setup
- [ ] CI/CD pipeline
- [ ] Staging deployment
- [ ] Production deployment
- [ ] Monitoring setup
- [ ] Documentation
- [ ] Training materials

### Week 4 Deliverables
✅ Multi-language support active  
✅ 80% test coverage achieved  
✅ System deployed to production  
✅ Documentation complete  

## Risk Management

### High-Risk Items
| Risk | Mitigation | Contingency |
|------|------------|-------------|
| Arabic RTL complexity | Early testing | Simplified layout |
| OAuth integration | Fallback auth | Username/password only |
| Performance issues | Early optimization | Reduce features |
| Timeline overrun | Daily standups | Scope reduction |

## Daily Workflow

### Daily Schedule
- **9:00 AM**: Daily standup
- **9:30 AM - 12:30 PM**: Development
- **1:30 PM - 5:30 PM**: Development
- **5:30 PM - 6:00 PM**: Code review
- **6:00 PM**: Daily commit

### Communication Plan
- Daily standups (15 min)
- Weekly progress reports
- Bi-weekly stakeholder demos
- Slack for instant communication
- GitHub for code collaboration

## Quality Gates

### Week 1 Gate
- [ ] Authentication working
- [ ] Database operational
- [ ] Basic APIs tested

### Week 2 Gate
- [ ] Core features complete
- [ ] Permissions working
- [ ] File upload functional

### Week 3 Gate
- [ ] All features implemented
- [ ] Email system tested
- [ ] Reports generating

### Week 4 Gate
- [ ] 80% test coverage
- [ ] Performance benchmarks met
- [ ] Production ready

## Success Metrics

### Technical Metrics
- Code coverage: ≥80%
- API response time: <500ms
- Page load time: <2s
- Zero critical bugs

### Project Metrics
- On-time delivery
- Within budget
- All features implemented
- Documentation complete

## Post-Launch Support (Days 31-75)

### Week 5-6: Stabilization
- Bug fixes
- Performance tuning
- User feedback collection
- Minor adjustments

### Week 7-8: Optimization
- Query optimization
- Cache tuning
- UI improvements
- Feature refinements

### Week 9-10: Handover
- Knowledge transfer
- Training sessions
- Documentation updates
- Support transition

---

*Document Version: 1.0*  
*Last Updated: January 2024*  
*MDC Transaction Tracking System*
EOF
echo "Created IMPLEMENTATION_ROADMAP.md"

echo "All remaining documentation files created successfully!"
