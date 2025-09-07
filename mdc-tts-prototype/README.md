# MDC TTS Prototype - Quick Start Guide

## Running the Server

This is a static HTML/CSS/JavaScript prototype. You have several options to run it:

### Option 1: Python HTTP Server (Simplest)
```bash
cd /home/kms/dev/mdc-v2/mdc-tts-prototype

# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```
Then open: http://localhost:8000

### Option 2: Node.js HTTP Server
```bash
# Install http-server globally (one time)
npm install -g http-server

# Run the server
cd /home/kms/dev/mdc-v2/mdc-tts-prototype
http-server -p 8000
```
Then open: http://localhost:8000

### Option 3: Live Server (VS Code)
1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

### Option 4: PHP Server
```bash
cd /home/kms/dev/mdc-v2/mdc-tts-prototype
php -S localhost:8000
```
Then open: http://localhost:8000

## Demo Credentials

Login with these test credentials:

- **Admin**: admin@mdc.com / admin123
- **Editor**: editor@mdc.com / editor123
- **Client**: client@mdc.com / client123

## Features Available

1. **Login Page** (`index.html`)
   - Email/password authentication
   - Google OAuth button (visual only)
   - Language toggle (EN/AR)
   - Remember me functionality

2. **Admin Dashboard** (`dashboard-admin.html`)
   - System-wide statistics
   - Transaction trends chart
   - User activity monitoring
   - Recent transactions table

3. **Editor Dashboard** (`dashboard-editor.html`)
   - Personal task management
   - Performance metrics
   - Assigned tasks with priorities
   - Quick create transaction modal

4. **Client Dashboard** (`dashboard-client.html`)
   - Account summary
   - Transaction status overview
   - Recent documents
   - Notification center

5. **Transactions Page** (`transactions.html`)
   - Advanced filtering and search
   - Table/Grid view toggle
   - Sort by columns
   - Status badges for all 9 states
   - Export functionality (visual)

## Navigation Flow

1. Start at login page (`index.html`)
2. Login with demo credentials
3. You'll be redirected to the appropriate dashboard based on role
4. Use the sidebar navigation to explore different pages
5. Language toggle (EN/AR) is available in the header

## File Structure

```
mdc-tts-prototype/
├── index.html              # Login page
├── dashboard-admin.html    # Admin dashboard
├── dashboard-editor.html   # Editor dashboard
├── dashboard-client.html   # Client dashboard
├── transactions.html       # Transactions list
├── css/
│   ├── styles.css         # Main design system
│   ├── login.css          # Login page styles
│   ├── dashboard.css      # Dashboard styles
│   └── transactions.css   # Transactions page styles
├── js/
│   ├── login.js           # Login functionality
│   ├── dashboard.js       # Common dashboard functions
│   ├── charts-admin.js    # Admin dashboard charts
│   ├── charts-client.js   # Client dashboard charts
│   └── transactions.js    # Transactions page logic
└── images/               # Logo and images (placeholder)
```

## Notes

- This is a static prototype for demonstration purposes
- Data is mocked and stored in browser session/localStorage
- Charts use Chart.js library (loaded from CDN)
- Bootstrap 5 is used for UI components
- All forms and buttons are functional but don't connect to a real backend
- RTL support is partially implemented with language toggle

## Browser Support

Works best in modern browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

*MDC TTS Static Prototype v1.0*