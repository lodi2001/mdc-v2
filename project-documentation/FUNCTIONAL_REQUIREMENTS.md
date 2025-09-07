# Functional Requirements - MDC Transaction Tracking System

## 1. User Management & Authentication

### 1.1 User Roles

#### Role Definitions
| Role | Description | Access Level |
|------|-------------|-------------|
| **Client** | External users who need to view their transaction status | Read-only access to own transactions |
| **Editor** | Internal staff managing day-to-day transactions | Create, edit, manage assigned transactions |
| **Admin** | System administrators with full control | Complete system access and configuration |

#### Role Permissions Matrix

| Feature | Client | Editor | Admin |
|---------|--------|--------|-------|
| **Authentication** |
| Login/Logout | ✓ | ✓ | ✓ |
| Change Password | ✓ | ✓ | ✓ |
| Reset Password | ✓ | ✓ | ✓ |
| **Transactions** |
| View Own Transactions | ✓ | ✓ | ✓ |
| View All Transactions | ✗ | ✗ | ✓ |
| Create Transaction | ✗ | ✓ | ✓ |
| Edit Own Transaction | ✗ | ✓ | ✓ |
| Edit Any Transaction | ✗ | ✗ | ✓ |
| Delete Transaction | ✗ | ✗ | ✓ |
| Change Transaction Status | ✗ | ✓ | ✓ |
| **Attachments** |
| View Attachments | ✓ | ✓ | ✓ |
| Upload Attachments | ✗ | ✓ | ✓ |
| Delete Attachments | ✗ | ✓ | ✓ |
| **Reports** |
| View Dashboard | ✓ | ✓ | ✓ |
| Generate Reports | ✓ | ✓ | ✓ |
| Export Data | ✓ | ✓ | ✓ |
| **Import/Export** |
| Bulk Import | ✗ | ✓ | ✓ |
| Bulk Export | ✗ | ✓ | ✓ |
| **Administration** |
| Manage Users | ✗ | ✗ | ✓ |
| View Audit Logs | ✗ | ✗ | ✓ |
| System Configuration | ✗ | ✗ | ✓ |
| Email Templates | ✗ | ✗ | ✓ |

### 1.2 Authentication Methods

#### Traditional Authentication
- **Username/Email**: Unique identifier for login
- **Password Requirements**:
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character
- **Session Management**:
  - JWT token expiry: 24 hours
  - Refresh token: 7 days
  - Auto-logout after 30 minutes of inactivity

#### Google OAuth Integration - NOT IMPLEMENTED
- One-click Google sign-in
- Automatic account creation on first login
- Email verification not required for OAuth users
- Profile information sync from Google account
- **Status**: Admin Settings UI has configuration fields, but Google OAuth functionality NOT IMPLEMENTED
- **Implementation**: Backend integration required - CRITICAL GAP

## 2. Transaction Management

### 2.1 Transaction Lifecycle States

| Status | Description | Next Possible States | Role Required |
|--------|-------------|---------------------|---------------|
| **Draft** | Initial creation, not yet submitted | Submitted, Cancelled | Editor/Admin |
| **Submitted** | Submitted for review | Under Review, Cancelled | Editor/Admin |
| **Under Review** | Being reviewed by approver | Approved, Submitted, Cancelled | Admin |
| **Approved** | Approved and ready for processing | In Progress, Cancelled | Editor/Admin |
| **In Progress** | Currently being processed | Completed, On Hold, Cancelled | Editor/Admin |
| **Completed** | Transaction successfully completed | None | - |
| **Cancelled** | Transaction cancelled | None | - |
| **On Hold** | Temporarily paused | In Progress, Cancelled | Admin |

### 2.2 Transaction Data Fields

#### Required Fields
- **Transaction ID**: Internal System Number (format: TRX-YYYY-NNNNN)
- **External Reference ID**: Client/External Reference Number (max 50 characters)
- **Client Name**: Client or organization name (max 255 characters)
- **Transaction Type**: Type of work/process from predefined list
- **Status**: Current lifecycle state
- **Created By**: User who created the transaction
- **Created Date**: Auto-timestamp

#### Optional Fields
- **Description**: Detailed description (max 2000 characters)
- **Category**: Work category (Architecture, Engineering, Construction, Planning, Consultation)
- **Priority**: Low, Normal, High, Urgent
- **Project ID**: Link to project (if applicable)
- **Assigned To**: Editor responsible for processing
- **Due Date**: Expected completion date
- **Comments**: Internal comments (not visible to clients)
- **Tags**: Searchable keywords
- **Attachments**: Associated documents
- **Department**: Responsible department

#### Transaction Types (Predefined List)
- **Document Review**: Review of submitted documents
- **Approval Request**: Request for official approval
- **Revision Request**: Request for document/plan revisions
- **Submission**: Initial document or plan submission
- **Information Request**: Request for additional information
- **Approval Processing**: Processing approval workflows
- **Document Upload**: Upload of required documents
- **Status Update**: Update on process status
- **Task Assignment**: Assignment of specific tasks
- **Review Completed**: Completion of review process

### 2.3 Transaction Operations

#### Create Transaction
- Form validation for required fields
- Auto-generate transaction ID
- Generate QR code automatically
- Set initial status to "Draft"
- Log creation in audit trail
- Send notification if assigned

#### Edit Transaction
- Track all changes in audit log
- Validate status transitions
- Update "updated_at" timestamp
- Send notification on status change
- Maintain change history

#### Delete Transaction
- Soft delete (mark as deleted, don't remove)
- Only admin role can delete
- Must provide deletion reason
- Cannot delete completed transactions
- Archive associated attachments

## 3. File Attachment System

### 3.1 File Requirements

#### Supported File Types
- Documents: PDF, DOC, DOCX, XLS, XLSX
- Images: JPG, JPEG, PNG, GIF
- Text: TXT, CSV
- Maximum file size: 10MB per file
- Maximum files per transaction: 20

#### File Operations
- **Upload**: Drag-and-drop or browse
- **Preview**: In-browser preview for images and PDFs
- **Download**: Direct download with original filename
- **Delete**: Soft delete with audit trail
- **Virus Scan**: Automatic scanning before storage

### 3.2 File Visibility Rules
- Clients see only files marked as "client-visible"
- Editors see all files on assigned transactions
- Admins see all files system-wide
- Internal documents can be marked "internal-only"

## 4. QR Code System

### 4.1 QR Code Generation
- Automatically generated for each transaction
- Contains transaction ID and verification URL
- Unique per transaction
- Regeneratable if needed
- High-resolution for printing

### 4.2 QR Code Usage
- Quick transaction lookup
- Mobile-friendly scanning
- Direct link to transaction details
- Printable for physical documents
- Trackable access logs

## 5. Email Notification System

### 5.1 Notification Triggers

| Event | Recipients | Template |
|-------|------------|----------|
| Transaction Created | Assigned Editor, Admin | transaction_created |
| Status Changed | Creator, Assigned Editor, Client | status_changed |
| Document Submitted | Client, Admin | document_submitted |
| Transaction Completed | All stakeholders | transaction_completed |
| Due Date Reminder | Assigned Editor | due_date_reminder |
| Overdue Alert | Assigned Editor, Admin | overdue_alert |
| User Account Created | New User | welcome_email |
| Password Reset | User | password_reset |

### 5.2 Email Configuration
- HTML and plain text versions
- Customizable templates
- Variable placeholders
- Multi-language support
- Unsubscribe options for non-critical emails
- Email queue with retry logic

## 6. Import/Export Functionality

### 6.1 Excel Import

#### Import Format
| Column | Field | Required | Validation |
|--------|-------|----------|------------|
| A | External Reference ID | Yes | Max 50 chars, alphanumeric |
| B | Client Name | Yes | Max 255 chars |
| C | Transaction Type | Yes | From predefined list |
| D | Description | No | Max 2000 chars |
| E | Category | No | Architecture/Engineering/Construction/Planning/Consultation |
| F | Due Date | No | Valid date format |
| G | Assigned To | No | Valid user email |
| H | Priority | No | Low/Normal/High/Urgent |

#### Import Features
- Download template file
- Validation before import
- Preview of data to import
- Error reporting per row
- Rollback on critical errors
- Progress indicator
- Import summary report

### 6.2 Data Export

#### Export Formats
- Excel (.xlsx)
- CSV (.csv)
- PDF (formatted report)

#### Export Options
- Date range selection
- Status filter
- Include/exclude attachments list
- Include audit trail
- Custom column selection

## 7. Multi-Language Support - FULLY IMPLEMENTED

### 7.1 Supported Languages - COMPLETE
- **English** (LTR - Left to Right)
- **Arabic** (RTL - Right to Left)
- **Status**: Full implementation with instant switching

### 7.2 Language Features - FULLY IMPLEMENTED
- User preference saved in profile
- Instant UI language switching
- Translated email notifications
- Localized date/time formats
- Localized number formats
- Currency symbol positioning
- Translated validation messages
- Bilingual report generation
- **Implementation**: Complete translation system with preserveOriginalText() and icon preservation
- **Fixed Issues**: All Arabic text in English UI resolved, proper RTL/LTR handling

## 8. Dashboard & Analytics

### 8.1 Dashboard Widgets

#### Client Dashboard
- My Transactions Summary
- Recent Transactions List
- Transaction Status Distribution
- Pending Actions
- Document Status Overview

#### Editor Dashboard
- Assigned Transactions
- Workload Overview
- Due Today/This Week
- Performance Metrics
- Recent Activities
- Task Completion Status

#### Admin Dashboard
- System Overview
- User Activity Statistics
- Transaction Volume Trends
- Status Distribution Chart
- Process Analytics
- System Health Indicators
- Recent Audit Events

### 8.2 Analytics Features
- Real-time data updates
- Interactive charts
- Drill-down capabilities
- Custom date ranges
- Export chart data
- Printable reports

## 9. Audit Logging

### 9.1 Logged Events
- User login/logout
- Transaction CRUD operations
- Status changes
- File uploads/deletions
- User management actions
- System configuration changes
- Report generation
- Data exports
- Failed login attempts
- Permission denied attempts

### 9.2 Audit Log Information
- Timestamp
- User ID and name
- IP address
- Action performed
- Entity type and ID
- Old value
- New value
- User agent/browser
- Session ID

## 10. Report Generation

### 10.1 Report Types

#### Transaction Reports
- Transaction Summary
- Transaction Detail Report
- Status Change History
- Progress Report
- Overdue Transactions
- Workload Distribution
- Performance Metrics

#### User Reports
- User Activity Report
- Login History
- Permission Usage

#### System Reports
- Audit Trail Report
- System Usage Statistics
- Performance Metrics
- Error Log Report

### 10.2 Report Features
- Scheduled generation
- Email delivery
- Multiple formats (PDF, Excel)
- Custom templates
- Filter and sort options
- Logo and branding
- Digital signatures

## 11. Search & Filter Capabilities

### 11.1 Search Features
- Global search across all accessible transactions
- Advanced search with multiple criteria
- Search by transaction ID, title, description
- Search by QR code
- Full-text search
- Search suggestions
- Recent searches

### 11.2 Filter Options
- Status filter
- Date range filter
- Transaction type filter
- Category filter
- Priority filter
- Assigned user filter
- Created by filter
- Has attachments filter
- Department filter

## 12. System Configuration - UI COMPLETE

### 12.1 Configurable Elements - UI ONLY, BACKEND PENDING
- Transaction categories
- Email templates
- Status workflow rules
- User role permissions
- System notifications
- Business rules
- Report templates
- Dashboard layouts
- **Status**: Admin Settings UI interface complete, but all backend functionality NOT IMPLEMENTED

### 12.2 System Settings - UI ONLY, BACKEND PENDING
- Company information
- Logo and branding
- Default time zone
- Working hours
- Holiday calendar
- Backup schedule
- Data retention policy
- Document templates
- Process workflows
- **Status**: Admin Settings UI page exists but all functionality NOT IMPLEMENTED
- **Features**: UI mockup only - save, reset, and Google OAuth features non-functional

## Implementation Status by User Role

### Current System Completion: 48% Overall

| User Role | Completion % | Pages Exist | Total Needed | Status |
|-----------|-------------|-------------|--------------|---------|
| **Admin Role** | 100% | 10/10 pages | 10 | **FULLY FUNCTIONAL** |
| **Editor Role** | 100% | 8/8 pages | 8 | **FULLY FUNCTIONAL** |
| **Client Role** | 50% | 4/6 pages | 6 | MAJOR GAPS - System not usable |
| **System Total** | 48% | 24/~52 pages | ~52 | CRITICAL PROGRESS MADE |

### Pages That EXIST (24 total):
1. ✅ index.html (Login page)
2. ✅ dashboard-admin.html (Admin dashboard)
3. ✅ dashboard-editor.html (Editor dashboard)
4. ✅ dashboard-client.html (Client dashboard)
5. ✅ transactions.html (Transaction list)
6. ✅ transaction-form.html (Create/edit transactions)
7. ✅ transaction-detail.html (Transaction details)
8. ✅ settings.html (Admin-only - 7 tabs)
9. ✅ users-list.html (Admin-only user management)
10. ✅ audit-logs.html (Admin-only audit logs)
11. ✅ email-templates.html (Admin-only templates)
12. ✅ reports.html (All roles - basic UI)
13. ✅ notifications.html (All roles)
14. ✅ assignments.html (Assignments)
15. ✅ assigned-tasks.html (Editor task management) - **NEWLY COMPLETED**
16. ✅ import-wizard.html (4-step import wizard) - **NEWLY COMPLETED** 
17. ✅ drafts.html (Draft management) - **NEWLY COMPLETED**
18. ✅ bulk-operations.html (Admin bulk operations) - **NEWLY COMPLETED**
19. ✅ Test pages (5 additional - not counted in percentages)

### CRITICAL MISSING PAGES by Role:

#### Editor Role - COMPLETED (All 8 pages) ✅:
- ✅ assigned-tasks.html - **UI COMPLETE** (task management dashboard)
- ✅ import-wizard.html - **UI COMPLETE** (4-step import wizard with CSV/Excel support)
- ✅ drafts.html - **UI COMPLETE** (draft management with auto-save)

#### Client Role - MISSING (2 pages):
- ❌ documents.html - **NOT IMPLEMENTED** (for document access)
- ❌ support.html - **NOT IMPLEMENTED** (for help/support)

#### Common Pages - MISSING (~25+ pages):
- ❌ Password reset pages (3 pages) - **NOT IMPLEMENTED**
- ❌ Profile management pages - **NOT IMPLEMENTED**
- ❌ Search/Filter pages - **NOT IMPLEMENTED**  
- ❌ Export/Download pages - **NOT IMPLEMENTED**
- ❌ Error pages (404, 500, maintenance) - **NOT IMPLEMENTED**
- ❌ File management pages - **NOT IMPLEMENTED**
- ❌ Many other core functionality pages - **NOT IMPLEMENTED**

### REMAINING SYSTEM GAPS:
- **Client users cannot effectively use the system** - Missing 50% of required pages  
- **Admin and Editor users can fully use the system** - 100% UI completion for both roles
- **Import/Export functionality UI COMPLETE** - All Editor import/export pages now exist
- **Password reset completely non-functional** - All pages missing
- **File/Document management completely missing** - No pages exist

---

*Document Version: 1.1*  
*Last Updated: January 2025*  
*MDC Transaction Tracking System*