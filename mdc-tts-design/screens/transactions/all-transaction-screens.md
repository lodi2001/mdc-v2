# Transaction Management Screens

## 1. Transaction List View

### Layout Structure
```
┌────────────────────────────────────────────────────────────────┐
│ Page Header: Transactions                                       │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ [+ New Transaction] [⬆ Import Excel] [⬇ Export]         │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│ Filter Bar:                                                     │
│ [Search...] [Status ▼] [Date Range] [Category ▼] [Clear]       │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ □ | ID | Title | Amount | Status | Date | Actions        │   │
│ ├─────────────────────────────────────────────────────────┤   │
│ │ □ TRX-2024-00145 | Project Alpha | 50,000 SAR           │   │
│ │   ● In Progress | Jan 15, 2024 | [View] [Edit] [...]    │   │
│ ├─────────────────────────────────────────────────────────┤   │
│ │ □ TRX-2024-00144 | Consultation Fee | 25,000 SAR        │   │
│ │   ● Pending | Jan 14, 2024 | [View] [Edit] [...]        │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│ Showing 1-20 of 245 | [Previous] [1] 2 3 ... 13 [Next]        │
└────────────────────────────────────────────────────────────────┘
```

### Filter Components
```css
.filter-bar {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 24px;
}

.search-box {
  flex: 2;
  position: relative;
}

.search-input {
  width: 100%;
  height: 40px;
  padding: 0 40px 0 16px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 14px;
}

.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
}

.filter-select {
  min-width: 140px;
  height: 40px;
  padding: 0 32px 0 12px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: white;
  appearance: none;
  cursor: pointer;
}

.date-range-picker {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  height: 40px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: white;
  cursor: pointer;
}
```

## 2. Create Transaction Form

### Form Layout
```
┌────────────────────────────────────────────────────────────────┐
│ < Back to Transactions          Create New Transaction          │
│                                                                  │
│ Transaction ID: TRX-2024-00146 (Auto-generated)                │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ Basic Information                                        │   │
│ ├─────────────────────────────────────────────────────────┤   │
│ │ Title *                                                  │   │
│ │ [________________________________]                       │   │
│ │                                                          │   │
│ │ Description                                              │   │
│ │ [________________________________]                       │   │
│ │ [________________________________]                       │   │
│ │                                                          │   │
│ │ Category *              Priority                         │   │
│ │ [Construction ▼]        [Normal ▼]                      │   │
│ │                                                          │   │
│ │ Project ID              Due Date                         │   │
│ │ [_______________]       [📅 Select Date]                │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ Financial Details                                        │   │
│ ├─────────────────────────────────────────────────────────┤   │
│ │ Amount *                Currency                         │   │
│ │ [_______________]       [SAR ▼]                         │   │
│ │                                                          │   │
│ │ Payment Terms                                            │   │
│ │ [________________________________]                       │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ Assignment                                               │   │
│ ├─────────────────────────────────────────────────────────┤   │
│ │ Assign To                                                │   │
│ │ [Select Editor ▼]                                        │   │
│ │                                                          │   │
│ │ Internal Notes (Not visible to clients)                  │   │
│ │ [________________________________]                       │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│ [Save as Draft] [Submit for Review] [Cancel]                   │
└────────────────────────────────────────────────────────────────┘
```

### Form Validation
```javascript
const validationRules = {
  title: {
    required: true,
    maxLength: 255,
    message: 'Title is required (max 255 characters)'
  },
  amount: {
    required: true,
    min: 0,
    pattern: /^\d+(\.\d{1,2})?$/,
    message: 'Valid amount required'
  },
  category: {
    required: true,
    message: 'Please select a category'
  },
  dueDate: {
    min: new Date(),
    message: 'Due date must be in the future'
  }
};
```

## 3. Transaction Detail View

### Detail Page Layout
```
┌────────────────────────────────────────────────────────────────┐
│ < Back | TRX-2024-00145                    [Edit] [Export PDF] │
│                                                                  │
│ ┌──────────────┬───────────────────────────────────────────┐  │
│ │              │ Project Alpha Development                  │  │
│ │  QR Code     │ Status: ● In Progress                      │  │
│ │   [████]     │ Amount: 50,000 SAR                        │  │
│ │   [████]     │ Created: Jan 15, 2024 by John Doe         │  │
│ │   [████]     │ Assigned to: Sarah Smith                  │  │
│ │              │ Due Date: Feb 15, 2024                     │  │
│ └──────────────┴───────────────────────────────────────────┘  │
│                                                                  │
│ [Details] [Status History] [Attachments] [Activity Log]        │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ Status History                                          │   │
│ ├─────────────────────────────────────────────────────────┤   │
│ │ ● Draft → ● Submitted → ● Approved → ● In Progress     │   │
│ │                                                         │   │
│ │ Jan 15, 10:00 AM - Status changed to Submitted         │   │
│ │ By: John Doe | Comment: Ready for review               │   │
│ │                                                         │   │
│ │ Jan 15, 2:30 PM - Status changed to Approved           │   │
│ │ By: Admin User | Comment: Approved for processing      │   │
│ │                                                         │   │
│ │ Jan 16, 9:00 AM - Status changed to In Progress        │   │
│ │ By: Sarah Smith | Comment: Started processing          │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│ Update Status:                                                  │
│ [Payment Pending ▼] [Add Comment...] [Update Status]           │
└────────────────────────────────────────────────────────────────┘
```

### Status Update Modal
```css
.status-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 480px;
  max-width: 90%;
  padding: 24px;
}

.modal-header {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 24px;
}

.status-select-group {
  margin-bottom: 16px;
}

.status-select {
  width: 100%;
  height: 44px;
  padding: 0 12px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 14px;
}

.comment-textarea {
  width: 100%;
  min-height: 100px;
  padding: 12px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}
```

## 4. File Upload Interface

### Drag & Drop Upload
```
┌─────────────────────────────────────────────────────────┐
│ Attachments                                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌ - - - - - - - - - - - - - - - - - - - - - - - - ┐   │
│  |                                                  |   │
│  |              📁 Drop files here                  |   │
│  |                    or                            |   │
│  |            [Browse Files]                        |   │
│  |                                                  |   │
│  |     Supported: PDF, JPG, PNG, DOC, DOCX, XLS    |   │
│  |           Maximum size: 10MB per file            |   │
│  |                                                  |   │
│  └ - - - - - - - - - - - - - - - - - - - - - - - - ┘   │
│                                                          │
│  Uploading:                                             │
│  invoice.pdf ████████████░░░░ 75%                      │
│                                                          │
│  Uploaded Files:                                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 📄 contract.pdf | 2.3MB | Jan 15 | [👁] [⬇] [🗑] │   │
│  │ 🖼 site-photo.jpg | 1.5MB | Jan 15 | [👁] [⬇] [🗑]│   │
│  │ 📊 budget.xlsx | 450KB | Jan 14 | [👁] [⬇] [🗑]  │   │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  Visibility: [●] Client Visible [ ] Internal Only       │
└─────────────────────────────────────────────────────────┘
```

### Upload Progress
```css
.upload-zone {
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  padding: 48px;
  text-align: center;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-zone.dragover {
  border-color: #1a5f3f;
  background: rgba(26, 95, 63, 0.05);
}

.upload-progress {
  margin: 16px 0;
  padding: 16px;
  background: white;
  border-radius: 6px;
}

.progress-bar {
  height: 4px;
  background: #e9ecef;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 8px;
}

.progress-fill {
  height: 100%;
  background: #1a5f3f;
  transition: width 0.3s ease;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  margin-bottom: 8px;
}

.file-icon {
  width: 32px;
  height: 32px;
  margin-right: 12px;
}

.file-info {
  flex: 1;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #212529;
}

.file-meta {
  font-size: 12px;
  color: #6c757d;
}

.file-actions {
  display: flex;
  gap: 8px;
}

.file-action-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.file-action-btn:hover {
  background: #f8f9fa;
  border-color: #adb5bd;
}
```

## 5. Bulk Import Screen

### Excel Import Interface
```
┌────────────────────────────────────────────────────────────────┐
│ Bulk Import Transactions                                        │
│                                                                  │
│ Step 1: Download Template                                       │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ Download our Excel template with the correct format      │   │
│ │ [⬇ Download Template]                                    │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│ Step 2: Upload Your File                                        │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ [Choose File] transactions.xlsx (2.3MB)                  │   │
│ │ ✓ File format validated                                  │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│ Step 3: Preview & Validate                                      │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ Found 45 transactions. 42 valid, 3 have errors.         │   │
│ │                                                          │   │
│ │ Row | Title | Amount | Status | Errors                   │   │
│ │ 1 ✓ | Project A | 50,000 | Valid |                     │   │
│ │ 2 ✓ | Project B | 25,000 | Valid |                     │   │
│ │ 3 ✗ | Project C | -100 | Error | Amount must be positive│   │
│ │ 4 ✓ | Project D | 75,000 | Valid |                     │   │
│ │ 5 ✗ | Project E | | Error | Amount is required         │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│ □ Skip rows with errors                                         │
│ □ Send email notifications for new transactions                 │
│                                                                  │
│ [Cancel] [Import Valid Transactions (42)]                       │
└────────────────────────────────────────────────────────────────┘
```

### Import Validation
```css
.import-preview-table {
  width: 100%;
  border-collapse: collapse;
  margin: 24px 0;
}

.import-row {
  border-bottom: 1px solid #e9ecef;
}

.import-row.valid {
  background: rgba(40, 167, 69, 0.05);
}

.import-row.error {
  background: rgba(220, 53, 69, 0.05);
}

.import-status-icon {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.import-status-icon.valid {
  background: #28a745;
  color: white;
}

.import-status-icon.error {
  background: #dc3545;
  color: white;
}

.error-message {
  color: #dc3545;
  font-size: 12px;
  margin-top: 4px;
}
```

## 6. Mobile Transaction Views

### Mobile List
```css
@media (max-width: 767px) {
  .transaction-list {
    padding: 0;
  }
  
  .transaction-card {
    padding: 16px;
    border-bottom: 1px solid #e9ecef;
  }
  
  .transaction-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  
  .transaction-id {
    font-size: 12px;
    color: #6c757d;
  }
  
  .transaction-status {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 12px;
  }
  
  .transaction-title {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 4px;
  }
  
  .transaction-amount {
    font-size: 18px;
    font-weight: 600;
    color: #1a5f3f;
  }
  
  .transaction-actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }
  
  .action-btn {
    flex: 1;
    padding: 8px;
    text-align: center;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    font-size: 14px;
  }
}
```

## 7. QR Code Display

### QR Code Component
```css
.qr-code-container {
  padding: 24px;
  background: white;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.qr-code-image {
  width: 200px;
  height: 200px;
  margin: 0 auto 16px;
  padding: 16px;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
}

.qr-code-label {
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 8px;
}

.qr-code-value {
  font-size: 16px;
  font-weight: 600;
  color: #212529;
  margin-bottom: 16px;
}

.qr-code-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.qr-action-btn {
  padding: 8px 16px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qr-action-btn:hover {
  background: #f8f9fa;
  border-color: #adb5bd;
}
```

---

*Transaction Management Screens v1.0 - MDC TTS*
