# RTL/LTR Bilingual Support Guide

## Arabic RTL Implementation

### 1. Layout Mirroring

#### CSS Direction
```css
/* Base RTL Setup */
[dir="rtl"] {
  direction: rtl;
  text-align: right;
}

/* LTR Setup */
[dir="ltr"] {
  direction: ltr;
  text-align: left;
}
```

#### Logical Properties
```css
/* Use logical properties instead of physical */
.component {
  /* Instead of: margin-left, margin-right */
  margin-inline-start: 16px;
  margin-inline-end: 16px;
  
  /* Instead of: padding-left, padding-right */
  padding-inline-start: 24px;
  padding-inline-end: 24px;
  
  /* Instead of: border-left, border-right */
  border-inline-start: 4px solid #1a5f3f;
}
```

### 2. Component Mirroring

#### Navigation
```css
/* Sidebar RTL */
[dir="rtl"] .sidebar {
  right: 0;
  left: auto;
  border-right: 1px solid #dee2e6;
  border-left: none;
}

[dir="rtl"] .sidebar-item {
  padding-right: 24px;
  padding-left: 48px;
}

[dir="rtl"] .sidebar-icon {
  margin-left: 12px;
  margin-right: 0;
}
```

#### Forms
```css
/* Form Elements RTL */
[dir="rtl"] .form-label {
  text-align: right;
}

[dir="rtl"] .form-input {
  text-align: right;
}

[dir="rtl"] .input-icon-left {
  right: 12px;
  left: auto;
}

[dir="rtl"] .input-icon-right {
  left: 12px;
  right: auto;
}
```

#### Tables
```css
/* Table RTL */
[dir="rtl"] .table th,
[dir="rtl"] .table td {
  text-align: right;
}

[dir="rtl"] .table-actions {
  margin-right: auto;
  margin-left: 0;
}
```

### 3. Typography

#### Font Families
```css
/* Arabic Fonts */
[dir="rtl"] {
  font-family: 'Noto Sans Arabic', 'Segoe UI', sans-serif;
}

[dir="rtl"] .heading {
  font-family: 'Cairo', 'Noto Sans Arabic', sans-serif;
}

/* English Fonts */
[dir="ltr"] {
  font-family: 'Inter', -apple-system, sans-serif;
}
```

#### Text Adjustments
```css
/* Arabic specific adjustments */
[dir="rtl"] {
  letter-spacing: 0; /* Arabic doesn't use letter spacing */
  line-height: 1.8; /* Slightly higher for Arabic */
}

[dir="rtl"] .arabic-number {
  font-family: 'Inter', sans-serif; /* Use English font for numbers */
  direction: ltr;
  display: inline-block;
}
```

### 4. Icons & Images

#### Directional Icons
```css
/* Flip directional icons */
[dir="rtl"] .icon-arrow-right,
[dir="rtl"] .icon-chevron-right,
[dir="rtl"] .icon-next {
  transform: scaleX(-1);
}

/* Don't flip universal icons */
[dir="rtl"] .icon-home,
[dir="rtl"] .icon-user,
[dir="rtl"] .icon-settings {
  transform: none;
}
```

### 5. Date & Number Formats

#### Date Formatting
```javascript
// Arabic date format
const formatDateAr = (date) => {
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    calendar: 'gregorian' // or 'islamic' based on preference
  }).format(date);
};

// English date format
const formatDateEn = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};
```

#### Number Formatting
```javascript
// Arabic numbers with Eastern Arabic numerals
const formatNumberAr = (num) => {
  return new Intl.NumberFormat('ar-SA', {
    useGrouping: true
  }).format(num);
};

// Currency formatting
const formatCurrency = (amount, lang) => {
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
    style: 'currency',
    currency: 'SAR'
  }).format(amount);
};
```

### 6. React Implementation

#### Language Context
```jsx
const LanguageContext = React.createContext();

const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const [direction, setDirection] = useState('ltr');

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    const newDir = newLang === 'ar' ? 'rtl' : 'ltr';
    
    setLanguage(newLang);
    setDirection(newDir);
    
    // Update document
    document.documentElement.lang = newLang;
    document.documentElement.dir = newDir;
    
    // Save preference
    localStorage.setItem('language', newLang);
  };

  return (
    <LanguageContext.Provider value={{
      language,
      direction,
      toggleLanguage,
      isRTL: direction === 'rtl'
    }}>
      {children}
    </LanguageContext.Provider>
  );
};
```

#### Component Usage
```jsx
const TransactionCard = () => {
  const { isRTL, language } = useLanguage();
  
  return (
    <div className={`card ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="card-header">
        <h3>{t('transaction.title', { lng: language })}</h3>
        <StatusBadge status={status} />
      </div>
      <div className="card-body">
        <div className="amount">
          {formatCurrency(amount, language)}
        </div>
        <div className="date">
          {language === 'ar' ? formatDateAr(date) : formatDateEn(date)}
        </div>
      </div>
    </div>
  );
};
```

### 7. Testing Considerations

#### RTL Testing Checklist
- [ ] All text aligns correctly
- [ ] Icons mirror appropriately
- [ ] Forms function properly
- [ ] Modals and dropdowns position correctly
- [ ] Charts and graphs display properly
- [ ] Tables sort and filter correctly
- [ ] Navigation works as expected
- [ ] Print layouts work in RTL
- [ ] Keyboard navigation maintains logical order

---

*RTL/LTR Guide v1.0 - MDC TTS*