# Login Screen Design

## Screen Overview
The login screen provides dual authentication methods (Google OAuth and traditional email/password) with a professional, split-screen layout suitable for the Saudi business environment.

## Visual Layout

### Desktop Layout (1024px+)
```
┌────────────────────────────────────────────────────────────┐
│                         Header Bar                          │
│  [MDC Logo]                              [EN/AR Toggle]     │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┬──────────────────────────────┐   │
│  │                     │                               │   │
│  │   Welcome Section   │     Login Form Section        │   │
│  │                     │                               │   │
│  │   MDC TTS Logo      │     ┌─────────────────────┐  │   │
│  │                     │     │ Sign in with Google │  │   │
│  │   "Transaction      │     └─────────────────────┘  │   │
│  │    Tracking         │                               │   │
│  │    System"          │          ─── OR ───          │   │
│  │                     │                               │   │
│  │   [Image of         │     Email/Username:          │   │
│  │    Saudi skyline]   │     ┌─────────────────────┐  │   │
│  │                     │     └─────────────────────┘  │   │
│  │                     │                               │   │
│  │   "Streamline       │     Password:                │   │
│  │    your financial   │     ┌─────────────────────┐  │   │
│  │    transactions"    │     └─────────────────────┘  │   │
│  │                     │                               │   │
│  │                     │     □ Remember me            │   │
│  │                     │                               │   │
│  │                     │     ┌─────────────────────┐  │   │
│  │                     │     │    Sign In          │  │   │
│  │                     │     └─────────────────────┘  │   │
│  │                     │                               │   │
│  │                     │     Forgot password?         │   │
│  │                     │                               │   │
│  └─────────────────────┴──────────────────────────────┘   │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Mobile Layout (320px - 767px)
```
┌──────────────────┐
│   [MDC Logo]     │
│                  │
│  Welcome Back!   │
│                  │
│ ┌──────────────┐ │
│ │ Google Login │ │
│ └──────────────┘ │
│                  │
│     ── OR ──    │
│                  │
│ Email:           │
│ ┌──────────────┐ │
│ └──────────────┘ │
│                  │
│ Password:        │
│ ┌──────────────┐ │
│ └──────────────┘ │
│                  │
│ □ Remember me    │
│                  │
│ ┌──────────────┐ │
│ │   Sign In    │ │
│ └──────────────┘ │
│                  │
│ Forgot password? │
│                  │
└──────────────────┘
```

## Component Specifications

### 1. Header Section
```css
.login-header {
  height: 80px;
  background: white;
  border-bottom: 1px solid var(--gray-200);
  padding: 0 var(--space-6);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  height: 48px;
  width: auto;
}

.language-toggle {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--gray-100);
  border-radius: var(--radius-full);
}
```

### 2. Welcome Section (Left Side - Desktop)
```css
.welcome-section {
  flex: 1;
  background: linear-gradient(135deg, #1a5f3f 0%, #2a7f5f 100%);
  color: white;
  padding: var(--space-16);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.welcome-title {
  font-size: var(--fs-4xl);
  font-weight: var(--fw-bold);
  margin-bottom: var(--space-4);
}

.welcome-subtitle {
  font-size: var(--fs-xl);
  opacity: 0.9;
  margin-bottom: var(--space-8);
}

.welcome-image {
  max-width: 400px;
  height: auto;
  opacity: 0.2;
  position: absolute;
  bottom: 0;
}
```

### 3. Login Form Section (Right Side - Desktop)
```css
.login-form-section {
  flex: 1;
  padding: var(--space-16);
  background: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 480px;
  margin: 0 auto;
}

.form-title {
  font-size: var(--fs-3xl);
  font-weight: var(--fw-semibold);
  color: var(--gray-900);
  margin-bottom: var(--space-8);
  text-align: center;
}
```

### 4. Google OAuth Button
```css
.google-signin-btn {
  width: 100%;
  height: 48px;
  background: white;
  border: 2px solid var(--gray-300);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  font-size: var(--fs-base);
  font-weight: var(--fw-medium);
  color: var(--gray-800);
  cursor: pointer;
  transition: all var(--transition-base);
}

.google-signin-btn:hover {
  background: var(--gray-50);
  border-color: var(--gray-400);
  box-shadow: var(--shadow-sm);
}

.google-icon {
  width: 20px;
  height: 20px;
}
```

### 5. Divider
```css
.auth-divider {
  margin: var(--space-6) 0;
  text-align: center;
  position: relative;
}

.auth-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--gray-300);
}

.auth-divider-text {
  background: white;
  padding: 0 var(--space-4);
  color: var(--gray-600);
  font-size: var(--fs-sm);
  position: relative;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
```

### 6. Form Fields
```css
.form-group {
  margin-bottom: var(--space-5);
}

.form-label {
  display: block;
  margin-bottom: var(--space-2);
  font-size: var(--fs-sm);
  font-weight: var(--fw-medium);
  color: var(--gray-700);
}

.form-input {
  width: 100%;
  height: 48px;
  padding: 0 var(--space-4);
  font-size: var(--fs-base);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  background: white;
  transition: all var(--transition-base);
}

.form-input:focus {
  outline: none;
  border-color: var(--mdc-primary);
  box-shadow: 0 0 0 3px rgba(26, 95, 63, 0.1);
}

.form-input.error {
  border-color: var(--danger);
}
```

### 7. Remember Me Checkbox
```css
.remember-group {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
}

.checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--gray-400);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.checkbox:checked {
  background: var(--mdc-primary);
  border-color: var(--mdc-primary);
}

.remember-label {
  font-size: var(--fs-sm);
  color: var(--gray-700);
  cursor: pointer;
}
```

### 8. Submit Button
```css
.submit-btn {
  width: 100%;
  height: 48px;
  background: var(--mdc-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--fs-base);
  font-weight: var(--fw-semibold);
  cursor: pointer;
  transition: all var(--transition-base);
}

.submit-btn:hover {
  background: var(--mdc-primary-dark);
  box-shadow: var(--shadow-md);
}

.submit-btn:active {
  transform: translateY(1px);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### 9. Forgot Password Link
```css
.forgot-password {
  text-align: center;
  margin-top: var(--space-4);
}

.forgot-password-link {
  color: var(--mdc-primary);
  font-size: var(--fs-sm);
  text-decoration: none;
  transition: color var(--transition-base);
}

.forgot-password-link:hover {
  color: var(--mdc-primary-dark);
  text-decoration: underline;
}
```

## Interaction States

### Form Validation
```javascript
// Real-time validation feedback
const validationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  },
  password: {
    required: true,
    minLength: 8,
    message: 'Password must be at least 8 characters'
  }
};
```

### Loading States
```css
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--gray-200);
  border-top-color: var(--mdc-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### Error Messages
```css
.error-message {
  margin-top: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: var(--danger-light);
  color: var(--danger-dark);
  border-radius: var(--radius-sm);
  font-size: var(--fs-sm);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.error-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
```

## Responsive Behavior

### Breakpoint Adjustments
```css
/* Tablet (768px - 1023px) */
@media (min-width: 768px) and (max-width: 1023px) {
  .welcome-section {
    display: none;
  }
  
  .login-form-section {
    max-width: 100%;
    padding: var(--space-8);
  }
}

/* Mobile (320px - 767px) */
@media (max-width: 767px) {
  .login-container {
    flex-direction: column;
  }
  
  .welcome-section {
    display: none;
  }
  
  .login-form-section {
    padding: var(--space-6) var(--space-4);
  }
  
  .form-title {
    font-size: var(--fs-2xl);
  }
}
```

## Accessibility Features

### Keyboard Navigation
- Tab order: Logo → Language toggle → Google button → Email → Password → Remember → Submit → Forgot password
- Enter key submits form when focused on inputs
- Escape key clears focused input

### Screen Reader Support
```html
<form role="form" aria-label="Login form">
  <div class="form-group">
    <label for="email" id="email-label">Email or Username</label>
    <input 
      type="email" 
      id="email" 
      aria-labelledby="email-label"
      aria-required="true"
      aria-invalid="false"
      aria-describedby="email-error"
    />
    <span id="email-error" role="alert" aria-live="polite"></span>
  </div>
</form>
```

### Focus Indicators
```css
*:focus-visible {
  outline: 2px solid var(--mdc-primary);
  outline-offset: 2px;
}

.form-input:focus {
  outline: none;
  border-color: var(--mdc-primary);
  box-shadow: 0 0 0 3px rgba(26, 95, 63, 0.1);
}
```

## Arabic (RTL) Considerations

### Layout Mirroring
```css
[dir="rtl"] .login-container {
  direction: rtl;
}

[dir="rtl"] .welcome-section {
  text-align: right;
}

[dir="rtl"] .form-label {
  text-align: right;
}

[dir="rtl"] .google-signin-btn {
  flex-direction: row-reverse;
}
```

### Arabic Typography
```css
[dir="rtl"] {
  font-family: var(--font-family-ar);
}

[dir="rtl"] .form-title {
  font-family: 'Cairo', var(--font-family-ar);
  font-weight: 600;
}
```

## Security Considerations

1. **Rate Limiting**: Show CAPTCHA after 3 failed attempts
2. **Password Masking**: Toggle visibility option
3. **Session Security**: Secure cookie settings for "Remember me"
4. **HTTPS Only**: Enforce secure connection
5. **CSRF Protection**: Include token in form submission

## Performance Optimization

1. **Lazy Load**: Background images load after critical content
2. **Code Splitting**: Separate OAuth SDK loading
3. **Prefetch**: Preload dashboard assets during login
4. **Optimistic UI**: Show loading state immediately on submit

---

*Login Screen Design v1.0 - MDC TTS*