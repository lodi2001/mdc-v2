# Database Schema - MDC Transaction Tracking System

## Database Design Overview

PostgreSQL 14 database with optimized schema for transaction management system.

## Entity Relationship Diagram

```
Users ──┬──< Transactions
        │         │
        │         ├──< Attachments
        │         │
        │         └──< Status_History
        │
        └──< Audit_Logs

Email_Queue (standalone)
System_Settings (standalone)
```

## Tables Schema

### 1. users
Primary user table for authentication and authorization.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(20) NOT NULL CHECK (role IN ('client', 'editor', 'admin')),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    company VARCHAR(255),
    department VARCHAR(100),
    oauth_provider VARCHAR(50),
    oauth_id VARCHAR(255),
    language_preference VARCHAR(5) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'Asia/Riyadh',
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;
```

### 2. transactions
Core transaction table with all business data.

```sql
CREATE TABLE transactions (
    id VARCHAR(20) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) DEFAULT 'SAR',
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    category VARCHAR(50),
    project_id VARCHAR(50),
    project_name VARCHAR(255),
    qr_code TEXT,
    qr_code_url VARCHAR(500),
    
    -- User relationships
    created_by UUID NOT NULL REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    
    -- Dates
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date DATE,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    
    -- Additional fields
    notes TEXT,
    internal_notes TEXT,
    tags TEXT[],
    metadata JSONB,
    
    -- Soft delete
    deleted_at TIMESTAMP,
    deleted_by UUID REFERENCES users(id),
    
    CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id),
    CONSTRAINT fk_approved_by FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_by ON transactions(created_by);
CREATE INDEX idx_transactions_assigned_to ON transactions(assigned_to);
CREATE INDEX idx_transactions_due_date ON transactions(due_date);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_project ON transactions(project_id);
CREATE INDEX idx_transactions_tags ON transactions USING GIN(tags);
CREATE INDEX idx_transactions_metadata ON transactions USING GIN(metadata);
```

### 3. status_history
Track all status changes for audit trail.

```sql
CREATE TABLE status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id VARCHAR(20) NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_by UUID NOT NULL REFERENCES users(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    comment TEXT,
    metadata JSONB
);

CREATE INDEX idx_status_history_transaction ON status_history(transaction_id);
CREATE INDEX idx_status_history_changed_at ON status_history(changed_at DESC);
```

### 4. attachments
File attachments for transactions.

```sql
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id VARCHAR(20) NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    file_hash VARCHAR(64),
    
    -- Visibility control
    visibility VARCHAR(20) DEFAULT 'all' CHECK (visibility IN ('all', 'internal', 'client')),
    
    -- Metadata
    uploaded_by UUID NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    tags TEXT[],
    
    -- Virus scan
    scan_status VARCHAR(20) DEFAULT 'pending',
    scan_result TEXT,
    scanned_at TIMESTAMP,
    
    -- Soft delete
    deleted_at TIMESTAMP,
    deleted_by UUID REFERENCES users(id)
);

CREATE INDEX idx_attachments_transaction ON attachments(transaction_id);
CREATE INDEX idx_attachments_uploaded_by ON attachments(uploaded_by);
CREATE INDEX idx_attachments_visibility ON attachments(visibility);
```

### 5. audit_logs
Comprehensive audit trail for all system actions.

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    username VARCHAR(255),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(255),
    entity_name VARCHAR(255),
    
    -- Change tracking
    old_value JSONB,
    new_value JSONB,
    changes JSONB,
    
    -- Request information
    ip_address INET,
    user_agent TEXT,
    request_id UUID,
    session_id VARCHAR(255),
    
    -- Metadata
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    execution_time_ms INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_session ON audit_logs(session_id);
```

### 6. email_queue
Email notification queue for async processing.

```sql
CREATE TABLE email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient VARCHAR(255) NOT NULL,
    cc TEXT,
    bcc TEXT,
    subject VARCHAR(500) NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    
    -- Template information
    template_name VARCHAR(100),
    template_params JSONB,
    language VARCHAR(5) DEFAULT 'en',
    
    -- Processing status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
    priority INT DEFAULT 5,
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_for TIMESTAMP,
    sent_at TIMESTAMP,
    failed_at TIMESTAMP,
    next_retry TIMESTAMP,
    
    -- Error tracking
    error_message TEXT,
    error_details JSONB,
    
    -- Relationships
    user_id UUID REFERENCES users(id),
    transaction_id VARCHAR(20) REFERENCES transactions(id),
    
    -- Metadata
    metadata JSONB,
    message_id VARCHAR(255)
);

CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_scheduled ON email_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_email_queue_recipient ON email_queue(recipient);
```

### 7. sessions
User session management.

```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    refresh_token_hash VARCHAR(255) UNIQUE,
    
    -- Session information
    ip_address INET,
    user_agent TEXT,
    device_type VARCHAR(50),
    location VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    refresh_expires_at TIMESTAMP,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    revoked_at TIMESTAMP,
    revoked_reason VARCHAR(255)
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_sessions_active ON sessions(is_active) WHERE is_active = true;
```

### 8. system_settings
System configuration and settings.

```sql
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    data_type VARCHAR(20) CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
    category VARCHAR(100),
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    is_editable BOOLEAN DEFAULT true,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_settings_key ON system_settings(key);
CREATE INDEX idx_system_settings_category ON system_settings(category);
```

### 9. notifications
User notification preferences and history.

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Notification data
    data JSONB,
    action_url VARCHAR(500),
    icon VARCHAR(100),
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    is_archived BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE is_read = false;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

## Database Views

### v_transaction_summary
Aggregated view for dashboard statistics.

```sql
CREATE VIEW v_transaction_summary AS
SELECT 
    t.status,
    COUNT(*) as count,
    SUM(t.amount) as total_amount,
    AVG(t.amount) as avg_amount,
    t.currency,
    DATE_TRUNC('month', t.created_at) as month
FROM transactions t
WHERE t.deleted_at IS NULL
GROUP BY t.status, t.currency, DATE_TRUNC('month', t.created_at);
```

### v_user_workload
View for editor workload distribution.

```sql
CREATE VIEW v_user_workload AS
SELECT 
    u.id,
    u.first_name || ' ' || u.last_name as full_name,
    COUNT(t.id) as assigned_transactions,
    COUNT(CASE WHEN t.status IN ('draft', 'submitted', 'under_review') THEN 1 END) as pending_count,
    COUNT(CASE WHEN t.due_date < CURRENT_DATE THEN 1 END) as overdue_count
FROM users u
LEFT JOIN transactions t ON t.assigned_to = u.id AND t.deleted_at IS NULL
WHERE u.role = 'editor'
GROUP BY u.id, u.first_name, u.last_name;
```

## Database Functions

### Update timestamp trigger
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Generate transaction ID
```sql
CREATE OR REPLACE FUNCTION generate_transaction_id()
RETURNS VARCHAR AS $$
DECLARE
    year_part VARCHAR;
    seq_num INT;
    new_id VARCHAR;
BEGIN
    year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(id FROM 9) AS INT)), 0) + 1
    INTO seq_num
    FROM transactions
    WHERE id LIKE 'TRX-' || year_part || '-%';
    
    new_id := 'TRX-' || year_part || '-' || LPAD(seq_num::TEXT, 5, '0');
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;
```

## Indexes Strategy

### Primary Indexes
- All primary keys have automatic indexes
- Foreign keys have indexes for join performance
- Frequently queried columns have covering indexes

### Composite Indexes
```sql
-- For transaction queries
CREATE INDEX idx_transactions_status_date ON transactions(status, created_at DESC);
CREATE INDEX idx_transactions_assigned_status ON transactions(assigned_to, status) WHERE deleted_at IS NULL;

-- For audit queries
CREATE INDEX idx_audit_user_date ON audit_logs(user_id, timestamp DESC);
CREATE INDEX idx_audit_entity_date ON audit_logs(entity_type, entity_id, timestamp DESC);
```

## Performance Optimizations

### Partitioning Strategy
For large tables, implement partitioning:

```sql
-- Partition audit_logs by month
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### Connection Pooling
- Max connections: 100
- Pool size: 20
- Overflow: 10
- Timeout: 30 seconds

### Query Optimization
- Use EXPLAIN ANALYZE for query planning
- Implement query result caching in Redis
- Use database views for complex queries
- Batch operations where possible

## Backup and Recovery

### Backup Strategy
- Daily full backups at 2:00 AM
- Hourly incremental backups
- Transaction log archiving
- 30-day retention policy

### Recovery Procedures
1. Point-in-time recovery using WAL
2. Standby server for failover
3. Regular recovery testing
4. RTO: 4 hours, RPO: 1 hour

---

*Document Version: 1.0*  
*Last Updated: January 2024*  
*MDC Transaction Tracking System*
