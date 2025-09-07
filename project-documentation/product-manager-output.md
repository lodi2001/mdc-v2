# MDC Transaction Tracking System - Product Requirements Document

## Executive Summary

### Company Overview
MDC Design Consultancy (mdc-sa.com) is a Saudi Arabian architectural and urban planning firm specializing in landscape architecture, interior design, urban development, and construction project management.

### Problem Statement
MDC currently faces challenges in tracking and managing financial transactions across multiple construction and architectural projects. The lack of a centralized system leads to:
- Delayed transaction processing
- Limited visibility for clients
- Manual tracking errors
- Inefficient reporting processes
- No real-time status updates

### Solution Overview
A comprehensive web-based Transaction Tracking System (TTS) built with React frontend and Django REST API backend, providing:
- Role-based access control for Clients, Editors, and Admins
- Real-time transaction status tracking with QR codes
- Automated email notifications
- Multi-language support (Arabic/English)
- Advanced reporting and analytics

### Success Metrics
- 50% reduction in transaction processing time
- 80% user adoption within first month
- Zero critical security vulnerabilities
- 99.9% system uptime
- <2 second page load times

### Budget & Timeline
- **Budget**: 7,500 SAR
- **Timeline**: 30 days (308 hours)
- **Team Size**: 2-3 developers

---

## 1. Project Requirements Document

### 1.1 Functional Requirements

#### User Roles and Permissions

| Feature | Client | Editor | Admin |
|---------|--------|--------|-------|
| View own transactions | ✓ | ✓ | ✓ |
| View all transactions | ✗ | ✗ | ✓ |
| Create transactions | ✗ | ✓ | ✓ |
| Edit assigned transactions | ✗ | ✓ | ✓ |
| Delete transactions | ✗ | ✗ | ✓ |
| Upload attachments | ✗ | ✓ | ✓ |
| View attachments | ✓ | ✓ | ✓ |
| Export reports | ✓ | ✓ | ✓ |
| Bulk import | ✗ | ✓ | ✓ |
| Manage users | ✗ | ✗ | ✓ |
| View audit logs | ✗ | ✗ | ✓ |
| Configure system | ✗ | ✗ | ✓ |

#### Transaction Lifecycle States
1. **Draft** - Initial creation, not submitted
2. **Submitted** - Submitted for review
3. **Under Review** - Being reviewed by approver
4. **Approved** - Approved, ready for processing
5. **In Progress** - Currently being processed
6. **Payment Pending** - Awaiting payment
7. **Paid** - Payment received
8. **Completed** - Successfully completed
9. **Cancelled** - Cancelled by user/admin
10. **On Hold** - Temporarily paused

#### Transaction Data Structure
```json
{
  "id": "TRX-2024-001",
  "title": "Project Payment - Building A",
  "description": "Monthly contractor payment",
  "amount": 50000.00,
  "currency": "SAR",
  "status": "In Progress",
  "priority": "High",
  "category": "Construction",
  "project_id": "PRJ-2024-015",
  "created_by": "user_id",
  "assigned_to": "editor_id",
  "qr_code": "base64_encoded_image",
  "attachments": [],
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-16T14:30:00Z",
  "due_date": "2024-02-01T00:00:00Z",
  "notes": "Internal notes"
}
```

#### Email Notification Triggers
- Transaction created
- Status changed
- Transaction assigned
- Payment received
- Transaction cancelled
- Approaching due date (3 days before)
- Overdue notification

#### Excel Import/Export Format
- **Import Columns**: Title, Description, Amount, Currency, Category, Due Date, Assigned To
- **Export Columns**: All transaction fields + audit history
- **File Format**: .xlsx with data validation
- **Max Rows**: 10,000 per import

### 1.2 Non-Functional Requirements

#### Performance Requirements
- **Page Load Time**: <2 seconds
- **API Response Time**: <500ms for 95% of requests
- **Concurrent Users**: Support 1000+ simultaneous users
- **Database Query Time**: <100ms
- **File Upload Size**: Maximum 10MB per file
- **Bulk Import**: Process 10,000 records in <60 seconds

#### Security Requirements
- **Authentication**: JWT tokens with 24-hour expiry
- **Password Policy**: Minimum 8 characters, uppercase, lowercase, number, special character
- **Encryption**: TLS 1.3 for all communications
- **Data Protection**: bcrypt for password hashing
- **Session Management**: Automatic logout after 30 minutes of inactivity
- **Rate Limiting**: 100 requests per minute per user

#### Availability & Reliability
- **Uptime**: 99.9% availability
- **Backup**: Daily automated backups
- **Recovery Time Objective (RTO)**: 4 hours
- **Recovery Point Objective (RPO)**: 24 hours

#### Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## 2. User Stories with Acceptance Criteria

### Authentication Stories

#### Story 1: User Login with Multiple Options
**As a** user  
**I want to** login using Google OAuth or username/password  
**So that** I can access the system securely with my preferred method

**Acceptance Criteria:**
- User can choose between Google OAuth or traditional login
- Google OAuth completes in <5 seconds
- Failed login shows appropriate error message
- Successful login redirects to dashboard
- JWT token is stored securely in httpOnly cookie

#### Story 2: Password Reset
**As a** user  
**I want to** reset my forgotten password  
**So that** I can regain access to my account

**Acceptance Criteria:**
- Password reset link sent to registered email
- Link expires after 1 hour
- New password must meet security requirements
- User receives confirmation email after reset
- Old password is immediately invalidated

#### Story 3: Language Toggle
**As a** user  
**I want to** switch between Arabic and English  
**So that** I can use the system in my preferred language

**Acceptance Criteria:**
- Language toggle available in header
- All UI elements translate immediately
- Arabic displays with proper RTL layout
- User preference is saved for future sessions
- Date/number formats adjust to locale

### Client Role Stories

#### Story 4: View My Transactions
**As a** Client  
**I want to** view all my transactions  
**So that** I can track payment status and history

**Acceptance Criteria:**
- Display list of all client's transactions
- Show status with color coding
- Include search and filter options
- Pagination for >20 transactions
- Mobile responsive layout

#### Story 5: Download Transaction Reports
**As a** Client  
**I want to** download transaction reports in PDF/Excel  
**So that** I can maintain records for accounting

**Acceptance Criteria:**
- Export options for PDF and Excel
- Include date range selection
- Report contains all transaction details
- Generated file downloads immediately
- Filename includes date and client ID

#### Story 6: View Transaction Attachments
**As a** Client  
**I want to** view attachments on my transactions  
**So that** I can access invoices and supporting documents

**Acceptance Criteria:**
- List all attachments with file names
- Preview images and PDFs in browser
- Download option for all file types
- Show file size and upload date
- Access restricted to client's own transactions

### Editor Role Stories

#### Story 7: Create New Transaction
**As an** Editor  
**I want to** create new transactions  
**So that** I can initiate payment processes

**Acceptance Criteria:**
- Form validates all required fields
- Auto-generate transaction ID
- Save as draft option available
- QR code generated automatically
- Success notification on creation

#### Story 8: Update Transaction Status
**As an** Editor  
**I want to** update transaction status  
**So that** I can reflect current processing state

**Acceptance Criteria:**
- Status dropdown shows valid transitions only
- Require comment for certain status changes
- Audit log captures all changes
- Email notification sent on update
- Timestamp recorded for each change

#### Story 9: Upload Attachments
**As an** Editor  
**I want to** upload supporting documents  
**So that** I can provide complete transaction information

**Acceptance Criteria:**
- Support PDF, JPG, PNG, DOCX formats
- Maximum 10MB per file
- Progress bar during upload
- Multiple file selection
- Virus scan before storage

#### Story 10: Bulk Import from Excel
**As an** Editor  
**I want to** import multiple transactions from Excel  
**So that** I can efficiently process batch payments

**Acceptance Criteria:**
- Download template option
- Validate data before import
- Show preview of records to import
- Progress indicator during import
- Summary report of success/failures

### Admin Role Stories

#### Story 11: Manage User Accounts
**As an** Admin  
**I want to** create and manage user accounts  
**So that** I can control system access

**Acceptance Criteria:**
- CRUD operations for users
- Assign/change user roles
- Enable/disable accounts
- Reset user passwords
- View last login information

#### Story 12: View Audit Logs
**As an** Admin  
**I want to** view complete audit trails  
**So that** I can monitor system usage and changes

**Acceptance Criteria:**
- Chronological list of all actions
- Filter by user, date, action type
- Export audit logs to CSV
- Include IP address and timestamp
- Search functionality

#### Story 13: Assign Transactions
**As an** Admin  
**I want to** assign transactions to editors  
**So that** I can distribute workload effectively

**Acceptance Criteria:**
- Bulk assignment option
- View editor workload
- Reassignment capability
- Notification sent to assigned editor
- Track assignment history

#### Story 14: Generate System Reports
**As an** Admin  
**I want to** generate comprehensive reports  
**So that** I can analyze system performance and usage

**Acceptance Criteria:**
- Predefined report templates
- Custom date ranges
- Multiple export formats
- Scheduled report generation
- Email delivery option

#### Story 15: Configure Email Templates
**As an** Admin  
**I want to** customize email notification templates  
**So that** I can maintain consistent communication

**Acceptance Criteria:**
- WYSIWYG editor for templates
- Variable placeholders
- Preview before saving
- Test email functionality
- Version history of changes

---

## 3. Technical Specifications

### 3.1 System Architecture

#### Frontend Architecture (React)
```
src/
├── components/
│   ├── common/
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   ├── Sidebar.jsx
│   │   └── LanguageToggle.jsx
│   ├── auth/
│   │   ├── Login.jsx
│   │   ├── GoogleAuth.jsx
│   │   └── PasswordReset.jsx
│   ├── transactions/
│   │   ├── TransactionList.jsx
│   │   ├── TransactionForm.jsx
│   │   ├── TransactionDetail.jsx
│   │   └── QRCodeDisplay.jsx
│   └── admin/
│       ├── UserManagement.jsx
│       ├── AuditLogs.jsx
│       └── Reports.jsx
├── services/
│   ├── api.js
│   ├── auth.js
│   └── transactions.js
├── contexts/
│   ├── AuthContext.jsx
│   └── LanguageContext.jsx
├── utils/
│   ├── validators.js
│   ├── formatters.js
│   └── constants.js
└── App.jsx
```

#### Backend Architecture (Django)
```
mdc_tts/
├── apps/
│   ├── authentication/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── permissions.py
│   ├── transactions/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── filters.py
│   ├── notifications/
│   │   ├── models.py
│   │   ├── tasks.py
│   │   └── templates/
│   └── reports/
│       ├── generators.py
│       └── exporters.py
├── core/
│   ├── settings.py
│   ├── urls.py
│   └── middleware.py
└── utils/
    ├── qr_generator.py
    ├── excel_processor.py
    └── audit_logger.py
```

### 3.2 Database Schema

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(20) NOT NULL CHECK (role IN ('client', 'editor', 'admin')),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    oauth_provider VARCHAR(50),
    oauth_id VARCHAR(255),
    language_preference VARCHAR(5) DEFAULT 'en',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Transactions table
CREATE TABLE transactions (
    id VARCHAR(20) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'SAR',
    status VARCHAR(20) NOT NULL,
    priority VARCHAR(10) DEFAULT 'normal',
    category VARCHAR(50),
    project_id VARCHAR(50),
    qr_code TEXT,
    created_by UUID REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date DATE,
    completed_at TIMESTAMP,
    notes TEXT
);

-- Attachments table
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id VARCHAR(20) REFERENCES transactions(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES users(id),
    visibility_role VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(255),
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email queue table
CREATE TABLE email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient VARCHAR(255) NOT NULL,
    cc VARCHAR(500),
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    template_name VARCHAR(100),
    parameters JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    error_message TEXT
);

-- Create indexes
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_assigned ON transactions(assigned_to);
CREATE INDEX idx_transactions_created_by ON transactions(created_by);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_email_queue_status ON email_queue(status);
```

### 3.3 API Endpoints Specification

#### Authentication Endpoints
```
POST /api/auth/login
Request: { "email": "user@example.com", "password": "password123" }
Response: { "access_token": "jwt_token", "refresh_token": "refresh_token", "user": {...} }

POST /api/auth/google
Request: { "id_token": "google_id_token" }
Response: { "access_token": "jwt_token", "refresh_token": "refresh_token", "user": {...} }

POST /api/auth/logout
Headers: Authorization: Bearer <token>
Response: { "message": "Logged out successfully" }

POST /api/auth/refresh
Request: { "refresh_token": "refresh_token" }
Response: { "access_token": "new_jwt_token" }

POST /api/auth/password-reset
Request: { "email": "user@example.com" }
Response: { "message": "Reset link sent to email" }

POST /api/auth/password-reset/confirm
Request: { "token": "reset_token", "new_password": "newPassword123!" }
Response: { "message": "Password reset successfully" }
```

#### Transaction Endpoints
```
GET /api/transactions
Query params: ?status=approved&page=1&limit=20&search=keyword
Response: { "results": [...], "total": 100, "page": 1, "pages": 5 }

GET /api/transactions/{id}
Response: { complete transaction object with attachments }

POST /api/transactions
Request: { transaction data }
Response: { created transaction with generated ID and QR code }

PUT /api/transactions/{id}
Request: { updated fields }
Response: { updated transaction }

DELETE /api/transactions/{id}
Response: { "message": "Transaction deleted successfully" }

POST /api/transactions/{id}/status
Request: { "status": "approved", "comment": "Approved by manager" }
Response: { updated transaction }

POST /api/transactions/bulk-import
Request: FormData with Excel file
Response: { "success": 95, "failed": 5, "errors": [...] }

GET /api/transactions/export
Query params: ?format=excel&start_date=2024-01-01&end_date=2024-12-31
Response: File download
```

#### Attachment Endpoints
```
POST /api/transactions/{id}/attachments
Request: FormData with file
Response: { "id": "attachment_id", "filename": "invoice.pdf", "url": "..." }

GET /api/attachments/{id}
Response: File download

DELETE /api/attachments/{id}
Response: { "message": "Attachment deleted successfully" }
```

#### User Management Endpoints (Admin only)
```
GET /api/users
Response: { "results": [...], "total": 50 }

POST /api/users
Request: { user data }
Response: { created user }

PUT /api/users/{id}
Request: { updated fields }
Response: { updated user }

DELETE /api/users/{id}
Response: { "message": "User deleted successfully" }

POST /api/users/{id}/reset-password
Response: { "message": "Password reset email sent" }
```

#### Reports Endpoints
```
GET /api/reports/dashboard
Response: { "stats": {...}, "charts": {...}, "recent_transactions": [...] }

GET /api/reports/transactions
Query params: ?format=pdf&start_date=2024-01-01&end_date=2024-12-31
Response: File download

GET /api/reports/audit-logs
Query params: ?user_id=123&action=create&page=1
Response: { "results": [...], "total": 1000 }
```

### 3.4 Security Implementation

#### JWT Token Structure
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "role": "editor",
  "exp": 1234567890,
  "iat": 1234567890
}
```

#### Permission Classes (Django)
```python
class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.created_by == request.user or request.user.role == 'admin'

class IsEditorOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ['editor', 'admin']

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'admin'
```

#### CORS Configuration
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://mdc-tts.com"
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = ['Authorization', 'Content-Type', 'X-Language']
```

---

## 4. Implementation Roadmap

### Week 1: Foundation & Setup (77 hours)

#### Day 1-2: Project Initialization (16 hours)
- Set up Django project structure
- Configure PostgreSQL database
- Set up Redis for caching
- Initialize React application
- Configure development environment
- Set up Git repository

#### Day 3-4: Authentication System (16 hours)
- Implement Django user model
- Set up JWT authentication
- Implement Google OAuth integration
- Create login/logout endpoints
- Build React login components
- Implement password reset flow

#### Day 5-7: Core Models & APIs (45 hours)
- Create transaction model
- Implement CRUD APIs
- Set up permission classes
- Build serializers
- Create basic React components
- Implement API service layer

### Week 2: Core Features (77 hours)

#### Day 8-9: File Management (16 hours)
- Implement file upload backend
- Configure file storage
- Create attachment model
- Build file upload UI
- Implement file preview
- Add virus scanning

#### Day 10-11: QR Code System (16 hours)
- Implement QR code generation
- Create QR display component
- Add QR scanning functionality
- Link QR to transactions

#### Day 12-14: Permissions & Audit (45 hours)
- Implement RBAC system
- Create audit logging
- Build permission decorators
- Create audit log viewer
- Test permission scenarios

### Week 3: Advanced Features (77 hours)

#### Day 15-16: Email Notifications (16 hours)
- Set up email service
- Create email templates
- Implement notification triggers
- Build email queue system
- Add email configuration UI

#### Day 17-18: Import/Export (16 hours)
- Implement Excel import
- Create data validators
- Build export functionality
- Create import preview UI
- Add batch processing

#### Day 19-21: Dashboard & Reports (45 hours)
- Create dashboard APIs
- Build analytics queries
- Implement report generation
- Create dashboard UI
- Build report viewer
- Add export options

### Week 4: Polish & Deployment (77 hours)

#### Day 22-23: Internationalization (16 hours)
- Implement i18n backend
- Add React i18n
- Create translation files
- Implement RTL support
- Test Arabic interface

#### Day 24-25: Frontend Polish (16 hours)
- Responsive design fixes
- UI/UX improvements
- Loading states
- Error handling
- Form validations

#### Day 26-27: Testing (16 hours)
- Write unit tests
- Create integration tests
- Perform load testing
- Security testing
- Bug fixes

#### Day 28-30: Deployment (29 hours)
- Set up Docker containers
- Configure Nginx
- Set up CI/CD pipeline
- Deploy to staging
- Production deployment
- Documentation completion

---

## 5. Testing Strategy

### 5.1 Test Coverage Distribution (80% Total)

#### Unit Tests (40% Coverage)
**Backend (Django)**
- Model validations
- Serializer methods
- Utility functions
- Permission checks
- QR code generation
- Email formatting

**Frontend (React)**
- Component rendering
- Form validations
- Utility functions
- API service methods
- Context providers

#### Integration Tests (25% Coverage)
- API endpoint flows
- Authentication workflows
- File upload/download
- Database transactions
- Email sending
- Cache operations

#### End-to-End Tests (15% Coverage)
- Complete user journeys
- Transaction lifecycle
- Login to logout flow
- Report generation
- Bulk import process

### 5.2 Test Scenarios

#### Authentication Testing
```python
def test_login_with_valid_credentials():
    # Test successful login
    
def test_login_with_invalid_credentials():
    # Test failed login
    
def test_jwt_token_expiry():
    # Test token expiration
    
def test_google_oauth_flow():
    # Test OAuth integration
```

#### Transaction Testing
```python
def test_create_transaction():
    # Test transaction creation
    
def test_status_transitions():
    # Test valid status changes
    
def test_invalid_status_transition():
    # Test invalid status changes
    
def test_permission_based_access():
    # Test role-based access
```

#### Performance Testing
- Load test with 1000 concurrent users
- Stress test API endpoints
- Database query optimization
- Cache effectiveness
- File upload limits

---

## 6. Deployment Architecture

### 6.1 Docker Compose Configuration
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/mdc_tts
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://backend:8000

  db:
    image: postgres:14
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=mdc_tts
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend
      - frontend

volumes:
  postgres_data:
```

### 6.2 CI/CD Pipeline (GitHub Actions)
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Backend Tests
        run: |
          cd backend
          python -m pytest --cov=./ --cov-report=xml
      - name: Run Frontend Tests
        run: |
          cd frontend
          npm test -- --coverage

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Build Docker Images
        run: |
          docker-compose build

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Production
        run: |
          # Deploy scripts
```

### 6.3 Production Environment
```
┌─────────────────────────────────────┐
│          CloudFlare CDN             │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│        Nginx Load Balancer          │
│         (SSL Termination)           │
└──────┬──────────────┬───────────────┘
       │              │
┌──────▼──────┐ ┌────▼──────┐
│   React     │ │  Django    │
│   Static    │ │    API     │
│   Files     │ │  (Gunicorn)│
└─────────────┘ └──────┬─────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼────────┐          ┌────────▼────────┐
│   PostgreSQL   │          │     Redis       │
│    Primary     │          │     Cache       │
└────────────────┘          └─────────────────┘
```

---

## 7. Budget Breakdown (7,500 SAR)

### Development Hours Allocation (308 hours)

| Phase | Hours | Cost (SAR) | Percentage |
|-------|-------|------------|------------|
| Backend Development | 97 | 3,000 | 40% |
| Frontend Development | 73 | 2,250 | 30% |
| Testing & QA | 36 | 1,125 | 15% |
| DevOps & Deployment | 24 | 750 | 10% |
| Documentation | 12 | 375 | 5% |
| Project Management Buffer | 66 | - | Reserve |
| **Total** | **308** | **7,500** | **100%** |

### Detailed Task Breakdown

#### Backend Development (97 hours - 3,000 SAR)
- Django project setup: 8 hours
- Authentication system: 16 hours
- Transaction models & APIs: 24 hours
- File management: 12 hours
- Email notifications: 10 hours
- QR code system: 8 hours
- Audit logging: 8 hours
- Report generation: 11 hours

#### Frontend Development (73 hours - 2,250 SAR)
- React project setup: 6 hours
- Authentication UI: 12 hours
- Transaction components: 18 hours
- Dashboard development: 12 hours
- File upload UI: 8 hours
- Internationalization: 8 hours
- Responsive design: 9 hours

#### Testing & QA (36 hours - 1,125 SAR)
- Unit tests: 14 hours
- Integration tests: 10 hours
- E2E tests: 6 hours
- Performance testing: 4 hours
- Bug fixes: 2 hours

#### DevOps & Deployment (24 hours - 750 SAR)
- Docker setup: 6 hours
- CI/CD pipeline: 6 hours
- Server configuration: 6 hours
- Production deployment: 4 hours
- Monitoring setup: 2 hours

#### Documentation (12 hours - 375 SAR)
- API documentation: 4 hours
- User manuals: 4 hours
- Deployment guides: 2 hours
- Code documentation: 2 hours

---

## 8. Risk Assessment & Mitigation

### 8.1 Technical Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|------------|--------|-------------------|
| Arabic RTL complexity | High | Medium | Use proven RTL libraries, test early |
| Performance at scale | Medium | High | Implement caching, optimize queries |
| OAuth integration issues | Low | Medium | Fallback to traditional auth |
| File storage limitations | Low | Low | Use cloud storage if needed |
| Database migration errors | Medium | High | Thorough testing, rollback plan |

### 8.2 Project Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|------------|--------|-------------------|
| Timeline overrun | Medium | High | Daily standups, clear priorities |
| Scope creep | High | High | Strict change control process |
| Resource availability | Low | Medium | Cross-training, documentation |
| Integration delays | Medium | Medium | Early integration testing |
| User adoption issues | Low | Medium | Training sessions, user guides |

### 8.3 Security Risks

| Risk | Mitigation |
|------|-----------|
| SQL Injection | Use ORM, parameterized queries |
| XSS Attacks | Input validation, output encoding |
| CSRF | Django CSRF tokens |
| Weak passwords | Strong password policy |
| Data breaches | Encryption, access controls |

---

## 9. Success Criteria

### 9.1 Technical Success Metrics

✅ **Performance Targets**
- Page load time: <2 seconds ✓
- API response time: <500ms for 95% requests ✓
- Database query time: <100ms ✓
- Concurrent users: 1000+ supported ✓

✅ **Quality Metrics**
- Test coverage: ≥80% ✓
- Code review completion: 100% ✓
- Zero critical bugs in production ✓
- Zero security vulnerabilities ✓

✅ **Availability Metrics**
- System uptime: ≥99.9% ✓
- Successful deployments: 100% ✓
- Backup success rate: 100% ✓

### 9.2 Business Success Metrics

✅ **Efficiency Improvements**
- Transaction processing time: 50% reduction ✓
- Manual error rate: 90% reduction ✓
- Report generation time: 75% faster ✓

✅ **User Adoption**
- User activation rate: 80% in first month ✓
- Daily active users: 60% of total ✓
- User satisfaction score: ≥4.5/5 ✓

✅ **Operational Metrics**
- Support tickets: <5% of transactions ✓
- Training completion: 100% of users ✓
- Feature utilization: >70% of features used ✓

### 9.3 Delivery Milestones

| Milestone | Due Date | Success Criteria |
|-----------|----------|-----------------|
| Week 1 Completion | Day 7 | Authentication working, basic APIs ready |
| Week 2 Completion | Day 14 | Core features functional |
| Week 3 Completion | Day 21 | All features implemented |
| Week 4 Completion | Day 30 | Deployed to production |
| Post-Launch | Day 45 | Warranty period complete |

---

## 10. Post-Launch Support Plan (45 Days)

### 10.1 Warranty Coverage

#### Week 1-2 Post-Launch
- Daily monitoring of system performance
- Immediate bug fixes for critical issues
- User support for login/access issues
- Performance optimization

#### Week 3-4 Post-Launch
- Weekly system health checks
- Minor feature adjustments
- User feedback collection
- Documentation updates

#### Week 5-6 Post-Launch
- Bi-weekly maintenance
- Knowledge transfer sessions
- Final optimization
- Handover preparation

### 10.2 Support Services Included

✅ **Bug Fixes**
- Critical bugs: Fixed within 4 hours
- Major bugs: Fixed within 24 hours
- Minor bugs: Fixed within 3 days

✅ **User Training**
- 2 training sessions for admins
- 3 training sessions for editors
- User guide creation
- Video tutorials

✅ **System Maintenance**
- Database optimization
- Cache tuning
- Security patches
- Backup verification

✅ **Documentation**
- API documentation updates
- User manual updates
- Deployment guide updates
- Troubleshooting guide

### 10.3 Exclusions from Warranty
- New feature development
- Major architectural changes
- Third-party integration issues
- Hardware failures
- Data migration from other systems

---

## Appendix A: Technology Stack Details

### Frontend Technologies
- **React 18.2**: UI library
- **TypeScript 5.0**: Type safety
- **React Router 6**: Navigation
- **Axios**: HTTP client
- **Bootstrap 5.3**: CSS framework
- **React-i18next**: Internationalization
- **React-QRCode**: QR code display
- **React-Hook-Form**: Form management
- **Chart.js**: Data visualization

### Backend Technologies
- **Django 4.2**: Web framework
- **Django REST Framework 3.14**: API framework
- **Python 3.10+**: Programming language
- **PostgreSQL 14**: Database
- **Redis 7**: Caching
- **Celery 5.3**: Task queue
- **Gunicorn**: WSGI server
- **Boto3**: File storage (S3)

### DevOps Tools
- **Docker 24**: Containerization
- **Docker Compose**: Orchestration
- **Nginx**: Reverse proxy
- **GitHub Actions**: CI/CD
- **Sentry**: Error tracking
- **Prometheus**: Monitoring
- **Grafana**: Visualization

---

## Appendix B: API Response Formats

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": ["Error message"]
    }
  }
}
```

### Pagination Response
```json
{
  "success": true,
  "data": {
    "results": [],
    "pagination": {
      "total": 100,
      "page": 1,
      "pages": 10,
      "limit": 10
    }
  }
}
```

---

## Appendix C: Status Transition Matrix

| From Status | To Status | Role Required | Conditions |
|-------------|-----------|--------------|------------|
| Draft | Submitted | Editor/Admin | All required fields filled |
| Submitted | Under Review | Editor/Admin | Assigned to reviewer |
| Under Review | Approved | Admin | Review completed |
| Under Review | Submitted | Editor/Admin | Needs changes |
| Approved | In Progress | Editor/Admin | Processing started |
| In Progress | Payment Pending | Editor/Admin | Work completed |
| Payment Pending | Paid | Admin | Payment confirmed |
| Paid | Completed | System | Automatic after payment |
| Any | Cancelled | Admin | With reason |
| Any | On Hold | Admin | With reason |

---

## Document Version

**Version**: 1.0  
**Date**: January 2024  
**Author**: Product Management Team  
**Company**: MDC Design Consultancy  
**Project**: Transaction Tracking System

---

*This document serves as the complete product requirements and technical specifications for the MDC Transaction Tracking System. It should be reviewed and approved by all stakeholders before development begins.*