// Login Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    const googleSigninBtn = document.querySelector('.google-signin-btn');
    const languageButtons = document.querySelectorAll('.language-toggle .btn');
    const errorAlert = document.getElementById('errorAlert');
    const errorMessage = document.getElementById('errorMessage');
    const successAlert = document.getElementById('successAlert');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const submitBtn = document.querySelector('.submit-btn');
    const submitBtnText = submitBtn.querySelector('.btn-text');
    const submitBtnSpinner = submitBtn.querySelector('.spinner-border');

    // Demo credentials for different user roles
    const demoUsers = {
        'admin@mdc.com': { password: 'admin123', role: 'admin', name: 'Admin User' },
        'editor@mdc.com': { password: 'editor123', role: 'editor', name: 'John Editor' },
        'client@mdc.com': { password: 'client123', role: 'client', name: 'Ahmed Al-Rashid' }
    };

    // Toggle password visibility
    togglePasswordBtn.addEventListener('click', function() {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        const icon = this.querySelector('i');
        icon.classList.toggle('bi-eye');
        icon.classList.toggle('bi-eye-slash');
    });

    // Language toggle
    languageButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            languageButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            const lang = this.dataset.lang;
            if (lang === 'ar') {
                // Switch to Arabic (RTL)
                document.documentElement.lang = 'ar';
                document.documentElement.dir = 'rtl';
                document.body.style.fontFamily = 'var(--font-family-ar)';
                updateTextToArabic();
            } else {
                // Switch to English (LTR)
                document.documentElement.lang = 'en';
                document.documentElement.dir = 'ltr';
                document.body.style.fontFamily = 'var(--font-family-en)';
                updateTextToEnglish();
            }
            
            // Save language preference
            localStorage.setItem('language', lang);
        });
    });

    // Form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Reset validation states
        emailInput.classList.remove('is-invalid');
        passwordInput.classList.remove('is-invalid');
        hideAlerts();
        
        // Get form values
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        // Validate email
        if (!validateEmail(email)) {
            emailInput.classList.add('is-invalid');
            return;
        }
        
        // Validate password
        if (password.length < 8) {
            passwordInput.classList.add('is-invalid');
            return;
        }
        
        // Show loading state
        showLoadingState();
        
        // Simulate API call
        await simulateLogin(email, password);
    });

    // Google Sign-in
    googleSigninBtn.addEventListener('click', function() {
        showLoadingState();
        
        // Simulate OAuth flow
        setTimeout(() => {
            hideLoadingState();
            showSuccess();
            
            // Store mock session
            const user = {
                email: 'oauth.user@gmail.com',
                name: 'OAuth User',
                role: 'client',
                authMethod: 'google'
            };
            localStorage.setItem('user', JSON.stringify(user));
            
            // Redirect after delay
            setTimeout(() => {
                window.location.href = 'dashboard-client.html';
            }, 1500);
        }, 1500);
    });

    // Forgot password link
    document.querySelector('.forgot-password-link').addEventListener('click', function(e) {
        e.preventDefault();
        alert('Password reset functionality would be implemented here. An email would be sent to the registered email address.');
    });

    // Helper Functions
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function showLoadingState() {
        submitBtn.disabled = true;
        submitBtnText.classList.add('d-none');
        submitBtnSpinner.classList.remove('d-none');
    }

    function hideLoadingState() {
        submitBtn.disabled = false;
        submitBtnText.classList.remove('d-none');
        submitBtnSpinner.classList.add('d-none');
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorAlert.classList.remove('d-none');
        successAlert.classList.add('d-none');
    }

    function showSuccess() {
        successAlert.classList.remove('d-none');
        errorAlert.classList.add('d-none');
    }

    function hideAlerts() {
        errorAlert.classList.add('d-none');
        successAlert.classList.add('d-none');
    }

    async function simulateLogin(email, password) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        hideLoadingState();
        
        // Check demo credentials
        const user = demoUsers[email];
        
        if (user && user.password === password) {
            // Successful login
            showSuccess();
            
            // Store session data
            const sessionData = {
                email: email,
                name: user.name,
                role: user.role,
                loginTime: new Date().toISOString()
            };
            
            // Remember me functionality
            if (rememberMeCheckbox.checked) {
                localStorage.setItem('user', JSON.stringify(sessionData));
                localStorage.setItem('rememberMe', 'true');
            } else {
                sessionStorage.setItem('user', JSON.stringify(sessionData));
            }
            
            // Redirect based on role
            setTimeout(() => {
                switch(user.role) {
                    case 'admin':
                        window.location.href = 'dashboard-admin.html';
                        break;
                    case 'editor':
                        window.location.href = 'dashboard-editor.html';
                        break;
                    case 'client':
                        window.location.href = 'dashboard-client.html';
                        break;
                    default:
                        window.location.href = 'dashboard.html';
                }
            }, 1500);
        } else {
            // Failed login
            showError('Invalid email or password. Please try again.');
            
            // Add shake animation to form
            loginForm.classList.add('shake');
            setTimeout(() => {
                loginForm.classList.remove('shake');
            }, 500);
        }
    }

    function updateTextToArabic() {
        document.querySelector('.form-title').textContent = 'مرحباً بعودتك';
        document.querySelector('.form-subtitle').textContent = 'قم بتسجيل الدخول للوصول إلى حسابك';
        document.querySelector('.google-signin-btn span').textContent = 'تسجيل الدخول بواسطة جوجل';
        document.querySelector('.auth-divider-text').textContent = 'أو';
        document.querySelector('label[for="email"]').textContent = 'البريد الإلكتروني أو اسم المستخدم';
        document.querySelector('#email').placeholder = 'أدخل بريدك الإلكتروني';
        document.querySelector('label[for="password"]').textContent = 'كلمة المرور';
        document.querySelector('#password').placeholder = 'أدخل كلمة المرور';
        document.querySelector('label[for="rememberMe"]').textContent = 'تذكرني';
        document.querySelector('.forgot-password-link').textContent = 'نسيت كلمة المرور؟';
        document.querySelector('.btn-text').textContent = 'تسجيل الدخول';
        document.querySelector('.login-footer p').innerHTML = 'ليس لديك حساب؟ <a href="#" class="text-decoration-none">تواصل مع المسؤول</a>';
    }

    function updateTextToEnglish() {
        document.querySelector('.form-title').textContent = 'Welcome Back';
        document.querySelector('.form-subtitle').textContent = 'Sign in to access your account';
        document.querySelector('.google-signin-btn span').textContent = 'Sign in with Google';
        document.querySelector('.auth-divider-text').textContent = 'OR';
        document.querySelector('label[for="email"]').textContent = 'Email or Username';
        document.querySelector('#email').placeholder = 'Enter your email';
        document.querySelector('label[for="password"]').textContent = 'Password';
        document.querySelector('#password').placeholder = 'Enter your password';
        document.querySelector('label[for="rememberMe"]').textContent = 'Remember me';
        document.querySelector('.forgot-password-link').textContent = 'Forgot password?';
        document.querySelector('.btn-text').textContent = 'Sign In';
        document.querySelector('.login-footer p').innerHTML = 'Don\'t have an account? <a href="#" class="text-decoration-none">Contact Administrator</a>';
    }

    // Set Arabic as default language
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage === 'en') {
        // Only keep English if explicitly saved
        document.querySelector('[data-lang="en"]').click();
    } else {
        // Default to Arabic
        document.querySelector('[data-lang="ar"]').click();
    }

    // Check for remember me on load
    const rememberedUser = localStorage.getItem('user');
    if (rememberedUser && localStorage.getItem('rememberMe') === 'true') {
        const user = JSON.parse(rememberedUser);
        emailInput.value = user.email;
        rememberMeCheckbox.checked = true;
    }

    // Add shake animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .shake {
            animation: shake 0.5s;
        }
    `;
    document.head.appendChild(style);

    // Add demo credentials hint
    const demoHint = document.createElement('div');
    demoHint.className = 'alert alert-info mt-3';
    demoHint.innerHTML = `
        <small>
            <strong>Demo Credentials:</strong><br>
            Admin: admin@mdc.com / admin123<br>
            Editor: editor@mdc.com / editor123<br>
            Client: client@mdc.com / client123
        </small>
    `;
    document.querySelector('.login-form-container').appendChild(demoHint);
});