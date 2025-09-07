# MDC TTS Style Guide

## 1. Color System

### Primary Palette

```css
/* Brand Colors */
--mdc-primary: #1a5f3f;        /* MDC Green - Professional, trustworthy */
--mdc-primary-light: #2a7f5f;  /* Hover states */
--mdc-primary-dark: #0a3f1f;   /* Active states */

/* Secondary Colors */
--mdc-secondary: #6c757d;       /* Neutral gray for secondary actions */
--mdc-secondary-light: #868e96; 
--mdc-secondary-dark: #495057;
```

### Status Colors

```css
/* Transaction Status Colors */
--status-draft: #6c757d;        /* Gray - Not submitted */
--status-submitted: #17a2b8;    /* Cyan - Under review */
--status-approved: #007bff;     /* Blue - Approved */
--status-in-progress: #0056b3;  /* Dark Blue - Processing */
--status-pending: #ffc107;      /* Yellow - Awaiting action */
--status-paid: #20c997;         /* Teal - Payment received */
--status-completed: #28a745;    /* Green - Successfully completed */
--status-cancelled: #dc3545;    /* Red - Cancelled */
--status-on-hold: #fd7e14;      /* Orange - Paused */
```

### Semantic Colors

```css
/* Feedback Colors */
--success: #28a745;
--success-light: #48d865;
--success-dark: #1e7e34;

--warning: #ffc107;
--warning-light: #ffda6a;
--warning-dark: #e0a800;

--danger: #dc3545;
--danger-light: #f1aeb5;
--danger-dark: #b02a37;

--info: #17a2b8;
--info-light: #3dd5f3;
--info-dark: #117a8b;
```

### Neutral Colors

```css
/* Grayscale */
--gray-900: #212529;  /* Primary text */
--gray-800: #343a40;  /* Headings */
--gray-700: #495057;  /* Secondary text */
--gray-600: #6c757d;  /* Muted text */
--gray-500: #adb5bd;  /* Borders */
--gray-400: #ced4da;  /* Light borders */
--gray-300: #dee2e6;  /* Backgrounds */
--gray-200: #e9ecef;  /* Light backgrounds */
--gray-100: #f8f9fa;  /* Very light backgrounds */
--white: #ffffff;     /* Pure white */
```

## 2. Typography

### Font Families

```css
/* English Typography */
--font-family-en: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-family-en-mono: 'Roboto Mono', 'Courier New', monospace;

/* Arabic Typography */
--font-family-ar: 'Noto Sans Arabic', 'Segoe UI', 'Arabic Typesetting', sans-serif;
--font-family-ar-display: 'Cairo', 'Noto Sans Arabic', sans-serif;
```

### Type Scale

```css
/* Font Sizes */
--fs-xs: 0.75rem;     /* 12px - Small labels */
--fs-sm: 0.875rem;    /* 14px - Body small */
--fs-base: 1rem;      /* 16px - Body default */
--fs-lg: 1.125rem;    /* 18px - Body large */
--fs-xl: 1.25rem;     /* 20px - H6 */
--fs-2xl: 1.5rem;     /* 24px - H5 */
--fs-3xl: 1.875rem;   /* 30px - H4 */
--fs-4xl: 2.25rem;    /* 36px - H3 */
--fs-5xl: 3rem;       /* 48px - H2 */
--fs-6xl: 3.75rem;    /* 60px - H1 */

/* Line Heights */
--lh-tight: 1.25;
--lh-base: 1.5;
--lh-relaxed: 1.75;
--lh-loose: 2;

/* Font Weights */
--fw-light: 300;
--fw-normal: 400;
--fw-medium: 500;
--fw-semibold: 600;
--fw-bold: 700;
--fw-black: 900;
```

### Typography Styles

```css
/* Headings */
.h1 {
  font-size: var(--fs-5xl);
  font-weight: var(--fw-bold);
  line-height: var(--lh-tight);
  color: var(--gray-900);
  margin-bottom: 1rem;
}

.h2 {
  font-size: var(--fs-4xl);
  font-weight: var(--fw-semibold);
  line-height: var(--lh-tight);
  color: var(--gray-800);
  margin-bottom: 0.875rem;
}

.h3 {
  font-size: var(--fs-3xl);
  font-weight: var(--fw-semibold);
  line-height: var(--lh-base);
  color: var(--gray-800);
  margin-bottom: 0.75rem;
}

/* Body Text */
.body-text {
  font-size: var(--fs-base);
  font-weight: var(--fw-normal);
  line-height: var(--lh-base);
  color: var(--gray-700);
}

.body-small {
  font-size: var(--fs-sm);
  line-height: var(--lh-base);
  color: var(--gray-600);
}

/* Labels */
.label {
  font-size: var(--fs-sm);
  font-weight: var(--fw-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--gray-600);
}
```

## 3. Spacing System

### Base Unit: 8px Grid

```css
/* Spacing Scale */
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### Component Spacing

```css
/* Padding */
--padding-xs: var(--space-2);
--padding-sm: var(--space-3);
--padding-md: var(--space-4);
--padding-lg: var(--space-6);
--padding-xl: var(--space-8);

/* Margins */
--margin-section: var(--space-16);
--margin-component: var(--space-8);
--margin-element: var(--space-4);
```

## 4. Layout System

### Container Widths

```css
/* Container Sizes */
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;
```

### Grid System

```css
/* 12 Column Grid */
.container {
  max-width: var(--container-xl);
  margin: 0 auto;
  padding: 0 var(--space-4);
}

.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-4);
}

/* Responsive Grid */
@media (max-width: 767px) {
  .grid { grid-template-columns: repeat(4, 1fr); }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .grid { grid-template-columns: repeat(8, 1fr); }
}

@media (min-width: 1024px) {
  .grid { grid-template-columns: repeat(12, 1fr); }
}
```

## 5. Component Styles

### Buttons

```css
/* Button Base */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-3) var(--space-6);
  font-size: var(--fs-base);
  font-weight: var(--fw-medium);
  line-height: 1.5;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px; /* Accessibility */
}

/* Button Variants */
.btn-primary {
  background: var(--mdc-primary);
  color: white;
  border-color: var(--mdc-primary);
}

.btn-primary:hover {
  background: var(--mdc-primary-light);
  border-color: var(--mdc-primary-light);
}

.btn-secondary {
  background: var(--mdc-secondary);
  color: white;
  border-color: var(--mdc-secondary);
}

.btn-outline {
  background: transparent;
  color: var(--mdc-primary);
  border-color: var(--mdc-primary);
}

/* Button Sizes */
.btn-sm {
  padding: var(--space-2) var(--space-4);
  font-size: var(--fs-sm);
  min-height: 36px;
}

.btn-lg {
  padding: var(--space-4) var(--space-8);
  font-size: var(--fs-lg);
  min-height: 52px;
}
```

### Form Elements

```css
/* Input Fields */
.form-control {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  font-size: var(--fs-base);
  line-height: 1.5;
  color: var(--gray-900);
  background: white;
  border: 1px solid var(--gray-400);
  border-radius: 6px;
  transition: border-color 0.2s ease;
  min-height: 44px;
}

.form-control:focus {
  outline: none;
  border-color: var(--mdc-primary);
  box-shadow: 0 0 0 3px rgba(26, 95, 63, 0.1);
}

/* Labels */
.form-label {
  display: block;
  margin-bottom: var(--space-2);
  font-size: var(--fs-sm);
  font-weight: var(--fw-medium);
  color: var(--gray-700);
}

/* Required Indicator */
.required::after {
  content: ' *';
  color: var(--danger);
}

/* Error State */
.form-control.is-invalid {
  border-color: var(--danger);
}

.invalid-feedback {
  display: block;
  margin-top: var(--space-2);
  font-size: var(--fs-sm);
  color: var(--danger);
}
```

### Cards

```css
/* Card Container */
.card {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  padding: var(--space-4) var(--space-6);
  background: var(--gray-100);
  border-bottom: 1px solid var(--gray-200);
}

.card-body {
  padding: var(--space-6);
}

.card-footer {
  padding: var(--space-4) var(--space-6);
  background: var(--gray-50);
  border-top: 1px solid var(--gray-200);
}
```

### Tables

```css
/* Table Base */
.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.table th {
  padding: var(--space-3) var(--space-4);
  background: var(--gray-100);
  font-size: var(--fs-sm);
  font-weight: var(--fw-semibold);
  text-align: left;
  color: var(--gray-700);
  border-bottom: 2px solid var(--gray-300);
}

.table td {
  padding: var(--space-4);
  border-bottom: 1px solid var(--gray-200);
  color: var(--gray-800);
}

.table tbody tr:hover {
  background: var(--gray-50);
}
```

## 6. Icons & Visual Elements

### Icon Sizes

```css
/* Icon Dimensions */
--icon-xs: 16px;
--icon-sm: 20px;
--icon-md: 24px;
--icon-lg: 32px;
--icon-xl: 48px;
```

### Status Indicators

```css
/* Status Badges */
.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-3);
  font-size: var(--fs-xs);
  font-weight: var(--fw-semibold);
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.badge-success {
  background: rgba(40, 167, 69, 0.1);
  color: var(--success-dark);
}

.badge-warning {
  background: rgba(255, 193, 7, 0.1);
  color: var(--warning-dark);
}

.badge-danger {
  background: rgba(220, 53, 69, 0.1);
  color: var(--danger-dark);
}
```

## 7. Effects & Animations

### Shadows

```css
/* Shadow Scale */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);
```

### Transitions

```css
/* Animation Timing */
--transition-fast: 150ms ease;
--transition-base: 250ms ease;
--transition-slow: 350ms ease;

/* Common Transitions */
.transition-all {
  transition: all var(--transition-base);
}

.transition-colors {
  transition: color var(--transition-fast), 
              background-color var(--transition-fast), 
              border-color var(--transition-fast);
}
```

### Border Radius

```css
/* Radius Scale */
--radius-none: 0;
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;
--radius-xl: 12px;
--radius-full: 999px;
```

## 8. Accessibility

### Focus States

```css
/* Focus Ring */
*:focus-visible {
  outline: 2px solid var(--mdc-primary);
  outline-offset: 2px;
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  .btn {
    border-width: 2px;
  }
  
  .form-control {
    border-width: 2px;
  }
}
```

### Color Contrast

All text colors meet WCAG AA standards:
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: 3:1 minimum

## 9. RTL/LTR Support

### Direction-Aware Properties

```css
/* Logical Properties */
.spacing-start {
  padding-inline-start: var(--space-4);
}

.spacing-end {
  padding-inline-end: var(--space-4);
}

.margin-start {
  margin-inline-start: var(--space-4);
}

/* RTL Specific */
[dir="rtl"] {
  --font-family: var(--font-family-ar);
  text-align: right;
  direction: rtl;
}

[dir="rtl"] .icon-chevron {
  transform: scaleX(-1);
}
```

## 10. Dark Mode (Optional)

```css
/* Dark Theme Variables */
@media (prefers-color-scheme: dark) {
  :root {
    --gray-900: #f8f9fa;
    --gray-800: #e9ecef;
    --gray-700: #dee2e6;
    --gray-600: #ced4da;
    --bg-primary: #1a1d23;
    --bg-secondary: #2d3139;
  }
}
```

---

*MDC TTS Style Guide v1.0 - January 2024*