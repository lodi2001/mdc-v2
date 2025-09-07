// Dashboard Common JavaScript

// Update user info immediately if available (before DOMContentLoaded)
(function() {
    const user = sessionStorage.getItem('user') || localStorage.getItem('user');
    if (user) {
        try {
            const userData = JSON.parse(user);
            // Set initial values immediately
            document.addEventListener('DOMContentLoaded', function() {
                updateUserInfo(userData);
            });
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
})();

document.addEventListener('DOMContentLoaded', function() {
    // Preserve original text immediately on page load
    if (window.preserveOriginalText) {
        window.preserveOriginalText();
        
        // Also preserve after a short delay to catch any dynamically created elements
        setTimeout(function() {
            window.preserveOriginalText();
        }, 100);
    }
    
    // Check authentication and update user info
    checkAuth();
    
    // Initialize sidebar
    initSidebar();
    
    // Initialize language toggle
    initLanguageToggle();
    
    // Initialize search
    initSearch();
    
    // Initialize tooltips
    initTooltips();
});

// Check if user is authenticated
function checkAuth() {
    const user = sessionStorage.getItem('user') || localStorage.getItem('user');
    if (!user) {
        window.location.href = 'index.html';
        return false;
    }
    
    const userData = JSON.parse(user);
    updateUserInfo(userData);
    return userData;
}

// Update user information in UI
function updateUserInfo(userData) {
    // Get display role based on actual role
    let displayRole = 'User';
    if (userData.role === 'admin') {
        displayRole = 'Admin';
    } else if (userData.role === 'editor') {
        displayRole = 'Editor';
    } else if (userData.role === 'client') {
        displayRole = 'Client';
    }
    
    // Update by class name
    const userNameElements = document.querySelectorAll('.user-name');
    const userRoleElements = document.querySelectorAll('.user-role');
    
    userNameElements.forEach(el => {
        el.textContent = userData.name || 'User';
    });
    
    userRoleElements.forEach(el => {
        // Set the role text with data-original-text for translation
        el.textContent = displayRole;
        el.setAttribute('data-original-text', displayRole);
    });
    
    // Also update by ID
    const userNameById = document.getElementById('userName');
    const userRoleById = document.getElementById('userRole');
    
    if (userNameById) {
        userNameById.textContent = userData.name || 'User';
    }
    
    if (userRoleById) {
        userRoleById.textContent = displayRole;
        userRoleById.setAttribute('data-original-text', displayRole);
    }
}

// Initialize sidebar
function initSidebar() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('show');
            
            // Close sidebar when clicking outside on mobile
            if (sidebar.classList.contains('show')) {
                document.addEventListener('click', closeSidebarOnClickOutside);
            }
        });
    }
    
    // Set active nav item based on current page
    setActiveNavItem();
}

// Close sidebar when clicking outside
function closeSidebarOnClickOutside(e) {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    
    if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
        sidebar.classList.remove('show');
        document.removeEventListener('click', closeSidebarOnClickOutside);
    }
}

// Set active navigation item
function setActiveNavItem() {
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
}

// Initialize language toggle
function initLanguageToggle() {
    const languageButtons = document.querySelectorAll('.language-toggle .btn');
    
    languageButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Preserve text before changing language
            if (window.preserveOriginalText) {
                window.preserveOriginalText();
            }
            
            // Remove active class from all buttons
            languageButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            const lang = this.dataset.lang;
            changeLanguage(lang);
            
            // Save language preference
            localStorage.setItem('language', lang);
        });
    });
    
    // Set Arabic as default language - with a small delay to ensure DOM is ready
    setTimeout(() => {
        const savedLanguage = localStorage.getItem('language');
        if (savedLanguage === 'en') {
            // Only keep English if explicitly saved
            const langButton = document.querySelector('[data-lang="en"]');
            if (langButton) {
                langButton.click();
            }
        } else {
            // Default to Arabic
            const langButton = document.querySelector('[data-lang="ar"]');
            if (langButton) {
                langButton.click();
            }
        }
    }, 50);
}

// Change language
function changeLanguage(lang) {
    if (lang === 'ar') {
        document.documentElement.lang = 'ar';
        document.documentElement.dir = 'rtl';
        document.body.style.fontFamily = 'var(--font-family-ar)';
        // Apply Arabic translations
        if (window.applyTranslations) {
            window.applyTranslations('ar');
        }
    } else {
        document.documentElement.lang = 'en';
        document.documentElement.dir = 'ltr';
        document.body.style.fontFamily = 'var(--font-family-en)';
        // Restore English text
        if (window.applyTranslations) {
            window.applyTranslations('en');
        }
    }
    
    // Dispatch language change event for charts
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: lang } }));
}

// Initialize search
function initSearch() {
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                performSearch(this.value);
            }
        });
        
        // Add search suggestions
        searchInput.addEventListener('input', debounce(function() {
            showSearchSuggestions(this.value);
        }, 300));
    }
}

// Perform search
function performSearch(query) {
    if (!query) return;
    
    // In a real application, this would search the database
    console.log('Searching for:', query);
    
    // Redirect to search results page
    window.location.href = `search-results.html?q=${encodeURIComponent(query)}`;
}

// Show search suggestions
function showSearchSuggestions(query) {
    if (!query) {
        hideSearchSuggestions();
        return;
    }
    
    // In a real application, this would fetch suggestions from the server
    const suggestions = [
        'TRX-2024-001',
        'TRX-2024-002',
        'Ahmed Al-Rashid',
        'Invoice Payment',
        'Pending Transactions'
    ].filter(s => s.toLowerCase().includes(query.toLowerCase()));
    
    // Show suggestions dropdown
    // Implementation would go here
}

// Hide search suggestions
function hideSearchSuggestions() {
    // Implementation would go here
}

// Initialize tooltips
function initTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Utility function: Debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Format currency
function formatCurrency(amount, currency = 'SAR') {
    return new Intl.NumberFormat('en-SA', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

// Format date
function formatDate(date) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(date).toLocaleDateString('en-US', options);
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    notification.style.zIndex = '9999';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Export functions for use in other scripts
window.dashboardUtils = {
    checkAuth,
    formatCurrency,
    formatDate,
    showNotification,
    changeLanguage
};