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
