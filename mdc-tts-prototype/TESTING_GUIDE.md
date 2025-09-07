# MDC TTS Platform - Testing Guide

## Overview
This guide provides step-by-step instructions for testing the MDC Transaction Tracking System prototype, with special focus on the dynamic sidebar navigation system and role-based access.

## Prerequisites
- Modern web browser (Chrome, Firefox, Safari, or Edge)
- Python 3 installed (for running local server)
- Access to the project files

## Starting the Application

### Option 1: Python HTTP Server (Recommended)
```bash
# Navigate to project directory
cd /home/kms/dev/mdc-v2/mdc-tts-prototype

# Start Python server
python3 -m http.server 8000
```
Then open browser to: http://localhost:8000

### Option 2: Direct File Access
Open `login.html` directly in your browser (some features may be limited)

## Login Credentials

### Demo Users
The platform includes three demo users with different roles:

| Role   | Email              | Password   | Access Level |
|--------|--------------------|------------|--------------|
| Admin  | admin@mdc.com      | admin123   | Full system access |
| Editor | editor@mdc.com     | editor123  | Transaction management |
| Client | client@mdc.com     | client123  | View-only access |

## Testing Scenarios

### 1. Basic Login Flow
1. Navigate to login page (`login.html`)
2. Verify Arabic is the default language
3. Test language toggle (AR/EN buttons)
4. Login with each demo credential
5. Verify redirect to appropriate dashboard:
   - Admin → `dashboard-admin.html`
   - Editor → `dashboard-editor.html`
   - Client → `dashboard-client.html`

### 2. Sidebar Navigation Consistency

#### Admin Role Testing
1. Login as admin@mdc.com
2. Verify sidebar shows these items:
   - Dashboard
   - All Transactions (with badge)
   - Create Transaction
   - User Management
   - Reports & Analytics
   - Assignments
   - Email Templates
   - Audit Logs
   - System Settings
3. Navigate to each page and confirm sidebar remains consistent
4. Test Arabic/English toggle on each page

#### Editor Role Testing
1. Login as editor@mdc.com
2. Verify sidebar shows these items:
   - Dashboard
   - My Transactions (with badge)
   - Create New
   - Assigned Transactions (with badge)
   - Bulk Import
   - Drafts (with badge)
   - Reports
3. Navigate between pages and verify sidebar consistency
4. Test language switching

#### Client Role Testing
1. Login as client@mdc.com
2. Verify sidebar shows these items:
   - Dashboard
   - My Transactions (with badge)
   - Documents
   - Reports
   - Support
3. Test navigation and language toggle

### 3. Cross-Role Navigation Test
1. Start with Admin role
2. Navigate to various pages (transactions, create transaction, etc.)
3. Logout and login as Editor
4. Verify sidebar updates to Editor menu
5. Navigate to same pages - confirm different sidebar
6. Repeat for Client role

### 4. Language Switching Test
1. On any page, switch from Arabic to English
2. Verify:
   - Sidebar menu items translate
   - Page content translates
   - Layout switches from RTL to LTR
3. Navigate to another page
4. Confirm language preference persists
5. Switch back to Arabic
6. Verify RTL layout and Arabic translations

### 5. Transaction Form Testing
1. Login as Admin or Editor
2. Click "Create Transaction" / "إنشاء معاملة"
3. Verify 4-step wizard appears:
   - Step 1: Basic Information
   - Step 2: Details
   - Step 3: Attachments
   - Step 4: Review
4. Fill sample data (no financial fields should appear)
5. Test navigation between steps
6. Verify sidebar remains consistent

### 6. Transaction Detail View
1. From transactions list, click on any transaction
2. Verify detail page shows:
   - Transaction information
   - Status timeline
   - Comments section
   - Attachments
   - QR code
3. Confirm sidebar remains role-appropriate
4. Test language toggle on detail page

### 7. Special Test Page
1. Navigate to `test-sidebar.html`
2. Use role switching buttons:
   - "Test Admin Role"
   - "Test Editor Role"
   - "Test Client Role"
3. Verify sidebar updates immediately
4. Navigate to other pages
5. Confirm selected role persists

## Common Issues and Solutions

### Issue: Sidebar Not Appearing
- Check browser console for JavaScript errors
- Ensure `sidebar.js` is loaded
- Verify user data in sessionStorage/localStorage

### Issue: Wrong Sidebar Menu
- Clear browser storage (localStorage/sessionStorage)
- Re-login with desired role
- Check user role in browser DevTools:
  ```javascript
  JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user'))
  ```

### Issue: Translations Not Working
- Verify `translations.js` is loaded
- Check language setting in localStorage:
  ```javascript
  localStorage.getItem('language')
  ```
- Try manual language toggle

### Issue: Navigation Links Broken
- Ensure all HTML files are present
- Check file paths are relative
- Verify Python server is running

## Browser Storage Inspection

### View Current User Role
1. Open browser DevTools (F12)
2. Go to Application/Storage tab
3. Check SessionStorage and LocalStorage
4. Look for 'user' key
5. Verify role field matches expected value

### Clear All Storage
```javascript
// Run in browser console
localStorage.clear();
sessionStorage.clear();
location.reload();
```

## Expected Behaviors

### Successful Implementation Indicators
✅ Sidebar appears on all pages  
✅ Menu items match user role  
✅ Navigation remains consistent across pages  
✅ Arabic/English translations work  
✅ RTL/LTR layout switches properly  
✅ Active page is highlighted in sidebar  
✅ Badges show appropriate counts  
✅ No financial fields in transaction forms  

### Known Limitations
- Email functionality is simulated
- Backend API calls are mocked
- Data doesn't persist between sessions
- Some pages show placeholder content
- QR codes are static images

## Testing Checklist

- [ ] Login page loads with Arabic default
- [ ] All three demo users can login
- [ ] Admin dashboard shows correct widgets
- [ ] Editor dashboard shows task-focused view
- [ ] Client dashboard shows limited options
- [ ] Sidebar consistent on all pages per role
- [ ] Create transaction form has no financial fields
- [ ] Transaction detail page loads properly
- [ ] Language toggle works on all pages
- [ ] RTL/LTR layout switches correctly
- [ ] Navigation links work properly
- [ ] Logout clears session data
- [ ] Test page role switching works

## Reporting Issues
If you encounter any issues during testing:
1. Note the user role you're logged in as
2. Record the page where issue occurred
3. Check browser console for errors
4. Take screenshot if visual issue
5. Document steps to reproduce

## Next Steps
After successful testing of current implementation:
1. Test remaining UI components as they're developed
2. Verify backend integration when available
3. Test real-time features when implemented
4. Validate security and permissions