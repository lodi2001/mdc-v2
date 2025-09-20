// Sidebar Management System for MDC TTS
// Handles role-based navigation and maintains consistency across all pages

(function() {
    'use strict';

    // Navigation structure for each role
    const navigationMenus = {
        admin: [
            {
                href: 'dashboard-admin.html',
                icon: 'bi-speedometer2',
                text: 'Dashboard',
                textAr: 'لوحة التحكم'
            },
            {
                href: 'transactions.html',
                icon: 'bi-receipt',
                text: 'All Transactions',
                textAr: 'جميع المعاملات',
                badge: { text: '234', class: 'bg-primary' }
            },
            {
                href: 'transaction-form.html',
                icon: 'bi-plus-square',
                text: 'Create Transaction',
                textAr: 'إنشاء معاملة'
            },
            {
                href: 'users-list.html',
                icon: 'bi-people',
                text: 'User Management',
                textAr: 'إدارة المستخدمين'
            },
            {
                href: 'notifications.html',
                icon: 'bi-bell',
                text: 'Notifications',
                textAr: 'الإشعارات',
                badge: { text: '5', class: 'bg-danger' }
            },
            {
                href: 'reports.html',
                icon: 'bi-graph-up',
                text: 'Reports & Analytics',
                textAr: 'التقارير والتحليلات'
            },
            {
                href: 'assignments.html',
                icon: 'bi-person-check',
                text: 'Assignments',
                textAr: 'المهام'
            },
            {
                href: 'email-templates.html',
                icon: 'bi-envelope',
                text: 'Email Templates',
                textAr: 'قوالب البريد الإلكتروني'
            },
            {
                href: 'audit-logs.html',
                icon: 'bi-clock-history',
                text: 'Audit Logs',
                textAr: 'سجلات التدقيق'
            },
            {
                href: 'settings.html',
                icon: 'bi-gear',
                text: 'System Settings',
                textAr: 'إعدادات النظام'
            }
        ],
        editor: [
            {
                href: 'dashboard-editor.html',
                icon: 'bi-speedometer2',
                text: 'Dashboard',
                textAr: 'لوحة التحكم'
            },
            {
                href: 'transactions.html',
                icon: 'bi-receipt',
                text: 'My Transactions',
                textAr: 'معاملاتي',
                badge: { text: '42', class: 'bg-primary' }
            },
            {
                href: 'transaction-form.html',
                icon: 'bi-plus-square',
                text: 'Create New',
                textAr: 'إنشاء جديد'
            },
            {
                href: 'assigned-tasks.html',
                icon: 'bi-list-task',
                text: 'Assigned Transactions',
                textAr: 'المعاملات المسندة',
                badge: { text: '12', class: 'bg-warning' }
            },
            {
                href: 'notifications.html',
                icon: 'bi-bell',
                text: 'Notifications',
                textAr: 'الإشعارات',
                badge: { text: '3', class: 'bg-danger' }
            },
            {
                href: 'import-wizard.html',
                icon: 'bi-upload',
                text: 'Bulk Import',
                textAr: 'استيراد جماعي'
            },
            {
                href: 'drafts.html',
                icon: 'bi-file-earmark',
                text: 'Drafts',
                textAr: 'المسودات',
                badge: { text: '5', class: 'bg-secondary' }
            },
            {
                href: 'reports.html',
                icon: 'bi-file-earmark-bar-graph',
                text: 'Reports',
                textAr: 'التقارير'
            }
        ],
        client: [
            {
                href: 'dashboard-client.html',
                icon: 'bi-speedometer2',
                text: 'Dashboard',
                textAr: 'لوحة التحكم'
            },
            {
                href: 'transactions.html',
                icon: 'bi-receipt',
                text: 'My Transactions',
                textAr: 'معاملاتي',
                badge: { text: '8', class: 'bg-primary' }
            },
            {
                href: 'documents.html',
                icon: 'bi-file-earmark-text',
                text: 'Documents',
                textAr: 'المستندات'
            },
            {
                href: 'notifications.html',
                icon: 'bi-bell',
                text: 'Notifications',
                textAr: 'الإشعارات',
                badge: { text: '2', class: 'bg-danger' }
            }
        ]
    };

    // Get user role from session/local storage
    function getUserRole() {
        const user = sessionStorage.getItem('user') || localStorage.getItem('user');
        if (user) {
            try {
                const userData = JSON.parse(user);
                return userData.role ? userData.role.toLowerCase() : 'client';
            } catch (e) {
                console.error('Error parsing user data:', e);
                return 'client';
            }
        }
        return 'client'; // Default to most restrictive role
    }

    // Get current page filename
    function getCurrentPage() {
        const path = window.location.pathname;
        const page = path.substring(path.lastIndexOf('/') + 1);
        return page || 'index.html';
    }

    // Check if menu item is active
    function isActive(menuHref, currentPage) {
        // Direct match
        if (menuHref === currentPage) {
            return true;
        }
        
        // Special cases for shared pages
        if (currentPage === 'transaction-detail.html' && 
            (menuHref === 'transactions.html' || menuHref === 'assigned-tasks.html')) {
            return false; // Don't highlight transactions for detail view
        }
        
        return false;
    }

    // Check if Arabic is active
    function isArabicActive() {
        const lang = document.documentElement.lang || 'ar';
        const savedLang = localStorage.getItem('language');
        return savedLang === 'ar' || (!savedLang && lang === 'ar');
    }

    // Generate sidebar HTML
    function generateSidebarHTML(role) {
        const menu = navigationMenus[role];
        if (!menu) {
            console.error('Invalid role:', role);
            return '';
        }

        const currentPage = getCurrentPage();
        const isArabic = isArabicActive();
        
        let html = `
        <aside class="sidebar" id="sidebar">
            <nav class="sidebar-nav">
                <ul class="nav flex-column">`;

        menu.forEach(item => {
            const activeClass = isActive(item.href, currentPage) ? ' active' : '';
            const text = isArabic ? item.textAr : item.text;
            
            html += `
                    <li class="nav-item">
                        <a class="nav-link${activeClass}" href="${item.href}">
                            <i class="bi ${item.icon}"></i>
                            <span data-original-text="${item.text}">${text}</span>`;
            
            if (item.badge) {
                html += `
                            <span class="badge ${item.badge.class} ms-auto">${item.badge.text}</span>`;
            }
            
            html += `
                        </a>
                    </li>`;
        });

        html += `
                </ul>
            </nav>
        </aside>`;

        return html;
    }

    // Update sidebar text when language changes
    function updateSidebarLanguage() {
        const role = getUserRole();
        const menu = navigationMenus[role];
        const isArabic = isArabicActive();
        
        document.querySelectorAll('.sidebar .nav-link').forEach((link, index) => {
            if (menu[index]) {
                const span = link.querySelector('span[data-original-text]');
                if (span) {
                    span.textContent = isArabic ? menu[index].textAr : menu[index].text;
                    // Also ensure href is correct
                    link.href = menu[index].href;
                }
            }
        });
    }

    // Initialize sidebar
    function initializeSidebar() {
        const role = getUserRole();
        
        // Find sidebar container
        let sidebarContainer = document.getElementById('sidebar-container');
        
        // If no container, look for existing sidebar to replace
        if (!sidebarContainer) {
            const existingSidebar = document.getElementById('sidebar');
            if (existingSidebar) {
                // Create container and replace existing sidebar
                sidebarContainer = document.createElement('div');
                sidebarContainer.id = 'sidebar-container';
                existingSidebar.parentNode.replaceChild(sidebarContainer, existingSidebar);
            } else {
                // Create container after header or at beginning of layout-wrapper
                const layoutWrapper = document.querySelector('.layout-wrapper');
                if (layoutWrapper) {
                    sidebarContainer = document.createElement('div');
                    sidebarContainer.id = 'sidebar-container';
                    layoutWrapper.insertBefore(sidebarContainer, layoutWrapper.firstChild);
                }
            }
        }

        // Generate and insert sidebar HTML
        if (sidebarContainer) {
            sidebarContainer.innerHTML = generateSidebarHTML(role);
            
            // Preserve original text for translations
            if (window.preserveOriginalText) {
                setTimeout(() => {
                    window.preserveOriginalText();
                }, 100);
            }
        }

        // Listen for language changes
        window.addEventListener('languageChanged', function(e) {
            updateSidebarLanguage();
        });
    }

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSidebar);
    } else {
        // DOM is already loaded
        initializeSidebar();
    }

    // Export for manual initialization if needed
    window.initializeDynamicSidebar = initializeSidebar;
    window.updateSidebarLanguage = updateSidebarLanguage;

})();