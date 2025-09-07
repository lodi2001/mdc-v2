// Settings Page JavaScript
console.log('MDC TTS Settings Page Initialized');

// Auto-save functionality
let autoSaveTimer = null;
let hasUnsavedChanges = false;

// Initialize settings page
document.addEventListener('DOMContentLoaded', function() {
    // Wait for dashboard.js to load first
    if (typeof checkAuth === 'undefined') {
        setTimeout(() => {
            initializeSettings();
            loadSettings();
            attachEventListeners();
            setupAutoSave();
            applyLanguagePreference();
        }, 100);
    } else {
        initializeSettings();
        loadSettings();
        attachEventListeners();
        setupAutoSave();
        applyLanguagePreference();
    }
});

// Apply saved language preference after page is fully loaded
function applyLanguagePreference() {
    // Get the saved language preference
    const savedLanguage = localStorage.getItem('language') || 'ar';
    
    // Wait for all scripts to load and initialize
    const applyLanguage = () => {
        // First apply general translations
        if (window.applyTranslations) {
            window.applyTranslations(savedLanguage);
        }
        
        // Then specifically handle the action buttons which might be missed
        if (savedLanguage === 'en') {
            // Force English text on these specific buttons
            const buttonsToFix = [
                { selector: 'span[data-original-text="Reset to Defaults"]', text: 'Reset to Defaults' },
                { selector: 'span[data-original-text="Save All Settings"]', text: 'Save All Settings' }
            ];
            
            buttonsToFix.forEach(btn => {
                const element = document.querySelector(btn.selector);
                if (element) {
                    element.textContent = btn.text;
                }
            });
        }
    };
    
    // Apply immediately and after a delay to handle any timing issues
    setTimeout(applyLanguage, 300);
    
    // Also apply when the window fully loads
    window.addEventListener('load', applyLanguage);
    
    // Use MutationObserver to ensure buttons stay in correct language
    if (savedLanguage === 'en') {
        const observer = new MutationObserver(() => {
            const resetBtn = document.querySelector('span[data-original-text="Reset to Defaults"]');
            const saveBtn = document.querySelector('span[data-original-text="Save All Settings"]');
            
            if (resetBtn && resetBtn.textContent !== 'Reset to Defaults') {
                resetBtn.textContent = 'Reset to Defaults';
            }
            if (saveBtn && saveBtn.textContent !== 'Save All Settings') {
                saveBtn.textContent = 'Save All Settings';
            }
        });
        
        // Start observing after a delay to avoid infinite loops
        setTimeout(() => {
            observer.observe(document.body, { 
                childList: true, 
                subtree: true,
                characterData: true 
            });
            
            // Stop observing after 2 seconds to avoid performance issues
            setTimeout(() => observer.disconnect(), 2000);
        }, 500);
    }
}

function initializeSettings() {
    // Check if user is admin (checkAuth is from dashboard.js)
    const user = sessionStorage.getItem('user') || localStorage.getItem('user');
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    try {
        const userData = JSON.parse(user);
        if (userData.role !== 'admin') {
            window.location.href = 'dashboard-admin.html';
            return;
        }
    } catch (e) {
        console.error('Error parsing user data:', e);
        window.location.href = 'index.html';
        return;
    }
    
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Set redirect URI
    const redirectUri = document.getElementById('redirectUri');
    if (redirectUri) {
        redirectUri.value = `${window.location.origin}/auth/google/callback`;
    }
}

function loadSettings() {
    // Load saved settings from localStorage (in production, this would be from API)
    const savedSettings = localStorage.getItem('systemSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        applySettings(settings);
    }
}

function applySettings(settings) {
    // General Settings
    if (settings.general) {
        setFieldValue('companyName', settings.general.companyName);
        setFieldValue('orgType', settings.general.orgType);
        setFieldValue('defaultLang', settings.general.defaultLang);
        setFieldValue('timezone', settings.general.timezone);
        setFieldValue('currency', settings.general.currency);
        setFieldValue('dateFormat', settings.general.dateFormat);
        setRadioValue('timeFormat', settings.general.timeFormat);
        setFieldValue('startTime', settings.general.startTime);
        setFieldValue('endTime', settings.general.endTime);
        
        // Working days
        if (settings.general.workingDays) {
            settings.general.workingDays.forEach(day => {
                const checkbox = document.getElementById(day);
                if (checkbox) checkbox.checked = true;
            });
        }
    }
    
    // User Management Settings
    if (settings.users) {
        setCheckboxValue('enableGoogleOAuth', settings.users.enableGoogleOAuth);
        setFieldValue('googleClientId', settings.users.googleClientId);
        setFieldValue('googleClientSecret', settings.users.googleClientSecret);
        setCheckboxValue('autoCreateAccounts', settings.users.autoCreateAccounts);
        setFieldValue('oauthDefaultRole', settings.users.oauthDefaultRole);
        setFieldValue('allowedDomains', settings.users.allowedDomains);
        setCheckboxValue('allowSelfRegister', settings.users.allowSelfRegister);
        setCheckboxValue('emailVerification', settings.users.emailVerification);
        setFieldValue('minPasswordLength', settings.users.minPasswordLength);
        setFieldValue('maxLoginAttempts', settings.users.maxLoginAttempts);
        setFieldValue('lockoutDuration', settings.users.lockoutDuration);
        setCheckboxValue('requireUppercase', settings.users.requireUppercase);
        setCheckboxValue('requireLowercase', settings.users.requireLowercase);
        setCheckboxValue('requireNumber', settings.users.requireNumber);
        setCheckboxValue('requireSpecial', settings.users.requireSpecial);
        setFieldValue('sessionTimeout', settings.users.sessionTimeout);
        setFieldValue('rememberDuration', settings.users.rememberDuration);
    }
    
    // Other settings tabs...
}

function attachEventListeners() {
    // Tab change tracking
    document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', function (e) {
            console.log('Switched to tab:', e.target.id);
        });
    });
    
    // OAuth toggle
    const oauthToggle = document.getElementById('enableGoogleOAuth');
    if (oauthToggle) {
        oauthToggle.addEventListener('change', function() {
            const oauthSettings = document.getElementById('oauthSettings');
            if (this.checked) {
                oauthSettings.classList.remove('disabled');
            } else {
                oauthSettings.classList.add('disabled');
            }
        });
    }
    
    // Track changes
    document.querySelectorAll('input, select, textarea').forEach(element => {
        element.addEventListener('change', function() {
            hasUnsavedChanges = true;
            scheduleAutoSave();
        });
    });
    
    // Warn before leaving with unsaved changes
    window.addEventListener('beforeunload', function(e) {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
}

function setupAutoSave() {
    // Auto-save every 30 seconds if there are changes
    setInterval(() => {
        if (hasUnsavedChanges) {
            autoSaveSettings();
        }
    }, 30000);
}

function scheduleAutoSave() {
    // Clear existing timer
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
    }
    
    // Schedule new auto-save in 5 seconds
    autoSaveTimer = setTimeout(() => {
        autoSaveSettings();
    }, 5000);
}

function autoSaveSettings() {
    const settings = collectSettings();
    localStorage.setItem('systemSettings', JSON.stringify(settings));
    hasUnsavedChanges = false;
    
    // Show auto-save indicator
    const indicator = document.getElementById('autoSaveIndicator');
    if (indicator) {
        indicator.classList.remove('d-none');
        setTimeout(() => {
            indicator.classList.add('d-none');
        }, 3000);
    }
}

function collectSettings() {
    const settings = {
        general: {
            companyName: getFieldValue('companyName'),
            orgType: getFieldValue('orgType'),
            defaultLang: getFieldValue('defaultLang'),
            timezone: getFieldValue('timezone'),
            currency: getFieldValue('currency'),
            dateFormat: getFieldValue('dateFormat'),
            timeFormat: getRadioValue('timeFormat'),
            startTime: getFieldValue('startTime'),
            endTime: getFieldValue('endTime'),
            workingDays: getCheckedDays()
        },
        users: {
            enableGoogleOAuth: getCheckboxValue('enableGoogleOAuth'),
            googleClientId: getFieldValue('googleClientId'),
            googleClientSecret: getFieldValue('googleClientSecret'),
            autoCreateAccounts: getCheckboxValue('autoCreateAccounts'),
            oauthDefaultRole: getFieldValue('oauthDefaultRole'),
            allowedDomains: getFieldValue('allowedDomains'),
            allowSelfRegister: getCheckboxValue('allowSelfRegister'),
            emailVerification: getCheckboxValue('emailVerification'),
            minPasswordLength: getFieldValue('minPasswordLength'),
            maxLoginAttempts: getFieldValue('maxLoginAttempts'),
            lockoutDuration: getFieldValue('lockoutDuration'),
            requireUppercase: getCheckboxValue('requireUppercase'),
            requireLowercase: getCheckboxValue('requireLowercase'),
            requireNumber: getCheckboxValue('requireNumber'),
            requireSpecial: getCheckboxValue('requireSpecial'),
            sessionTimeout: getFieldValue('sessionTimeout'),
            rememberDuration: getFieldValue('rememberDuration')
        },
        transactions: {
            idPattern: getFieldValue('idPattern'),
            startingNumber: getFieldValue('startingNumber')
        },
        notifications: {
            emailNotifications: getCheckboxValue('emailNotifications'),
            smsNotifications: getCheckboxValue('smsNotifications'),
            inAppNotifications: getCheckboxValue('inAppNotifications'),
            pushNotifications: getCheckboxValue('pushNotifications')
        },
        email: {
            smtpServer: getFieldValue('smtpServer'),
            smtpPort: getFieldValue('smtpPort'),
            smtpSecurity: getFieldValue('smtpSecurity'),
            smtpUsername: getFieldValue('smtpUsername'),
            smtpPassword: getFieldValue('smtpPassword'),
            fromName: getFieldValue('fromName'),
            fromEmail: getFieldValue('fromEmail'),
            replyToEmail: getFieldValue('replyToEmail')
        },
        maintenance: {
            autoBackup: getCheckboxValue('autoBackup'),
            backupSchedule: getFieldValue('backupSchedule'),
            backupTime: getFieldValue('backupTime'),
            retentionPeriod: getFieldValue('retentionPeriod'),
            transactionRetention: getFieldValue('transactionRetention'),
            auditRetention: getFieldValue('auditRetention'),
            emailRetention: getFieldValue('emailRetention')
        },
        security: {
            twoFactorAuth: getCheckboxValue('twoFactorAuth'),
            ipWhitelist: getCheckboxValue('ipWhitelist'),
            allowedIPs: getFieldValue('allowedIPs'),
            maxFileSize: getFieldValue('maxFileSize'),
            maxFilesPerTransaction: getFieldValue('maxFilesPerTransaction'),
            enableAuditLog: getCheckboxValue('enableAuditLog'),
            logLevel: getFieldValue('logLevel')
        }
    };
    
    return settings;
}

// Helper functions
function getFieldValue(id) {
    const element = document.getElementById(id);
    return element ? element.value : '';
}

function setFieldValue(id, value) {
    const element = document.getElementById(id);
    if (element && value !== undefined) {
        element.value = value;
    }
}

function getCheckboxValue(id) {
    const element = document.getElementById(id);
    return element ? element.checked : false;
}

function setCheckboxValue(id, value) {
    const element = document.getElementById(id);
    if (element && value !== undefined) {
        element.checked = value;
    }
}

function getRadioValue(name) {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.id : '';
}

function setRadioValue(name, value) {
    const radio = document.getElementById(value);
    if (radio) {
        radio.checked = true;
    }
}

function getCheckedDays() {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days.filter(day => {
        const checkbox = document.getElementById(day);
        return checkbox && checkbox.checked;
    });
}

// Action functions
function saveAllSettings() {
    const settings = collectSettings();
    
    // In production, this would be an API call
    localStorage.setItem('systemSettings', JSON.stringify(settings));
    hasUnsavedChanges = false;
    
    // Show success message
    showNotification('Settings saved successfully!', 'success');
}

function resetToDefaults() {
    if (confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
        localStorage.removeItem('systemSettings');
        location.reload();
    }
}

function toggleSecretVisibility() {
    const secretInput = document.getElementById('googleClientSecret');
    const eyeIcon = document.getElementById('secretEyeIcon');
    
    if (secretInput.type === 'password') {
        secretInput.type = 'text';
        eyeIcon.classList.remove('bi-eye');
        eyeIcon.classList.add('bi-eye-slash');
    } else {
        secretInput.type = 'password';
        eyeIcon.classList.remove('bi-eye-slash');
        eyeIcon.classList.add('bi-eye');
    }
}

function copyRedirectUri() {
    const redirectUri = document.getElementById('redirectUri');
    redirectUri.select();
    document.execCommand('copy');
    showNotification('Redirect URI copied to clipboard!', 'info');
}

function testOAuthConnection() {
    const clientId = getFieldValue('googleClientId');
    const clientSecret = getFieldValue('googleClientSecret');
    
    if (!clientId || !clientSecret) {
        showOAuthTestResult('Please enter both Client ID and Client Secret', 'error');
        return;
    }
    
    // Show loading state
    showOAuthTestResult('Testing connection...', 'info');
    
    // Simulate API call (in production, this would be a real API call)
    setTimeout(() => {
        if (clientId.includes('apps.googleusercontent.com')) {
            showOAuthTestResult('OAuth connection successful!', 'success');
        } else {
            showOAuthTestResult('Invalid Client ID format', 'error');
        }
    }, 2000);
}

function showOAuthTestResult(message, type) {
    const resultDiv = document.getElementById('oauthTestResult');
    if (resultDiv) {
        resultDiv.className = `mt-2 ${type}`;
        resultDiv.innerHTML = `
            <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info-circle'} me-2"></i>
            ${message}
        `;
    }
}

function testEmailConnection() {
    const server = getFieldValue('smtpServer');
    const port = getFieldValue('smtpPort');
    const username = getFieldValue('smtpUsername');
    const password = getFieldValue('smtpPassword');
    
    if (!server || !port || !username || !password) {
        showNotification('Please fill in all SMTP settings', 'warning');
        return;
    }
    
    // Simulate testing
    showNotification('Testing email connection...', 'info');
    
    setTimeout(() => {
        showNotification('Email connection successful!', 'success');
    }, 2000);
}

function sendTestEmail() {
    const fromEmail = getFieldValue('fromEmail');
    
    if (!fromEmail) {
        showNotification('Please configure email settings first', 'warning');
        return;
    }
    
    const testEmail = prompt('Enter email address to send test email:');
    if (testEmail) {
        showNotification(`Test email sent to ${testEmail}`, 'success');
    }
}

function runManualBackup() {
    if (confirm('Start manual backup? This may take a few minutes.')) {
        showNotification('Backup started...', 'info');
        
        // Simulate backup process
        setTimeout(() => {
            showNotification('Backup completed successfully!', 'success');
        }, 3000);
    }
}

function previewLogo() {
    const logoInput = document.getElementById('systemLogo');
    if (logoInput && logoInput.files && logoInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // In production, show preview in a modal
            console.log('Logo preview:', e.target.result);
        };
        reader.readAsDataURL(logoInput.files[0]);
    }
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    notification.style.zIndex = '9999';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}