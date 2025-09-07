// Notifications Management System

// Sample notifications data
const notificationsData = [
    {
        id: 1,
        type: 'transaction',
        icon: 'bi-cash-stack',
        iconColor: 'primary',
        title: 'New Transaction Created',
        message: 'Transaction TRX-2024-0234 has been created and pending approval',
        timestamp: new Date(Date.now() - 2 * 60000), // 2 minutes ago
        read: false
    },
    {
        id: 2,
        type: 'success',
        icon: 'bi-check-circle',
        iconColor: 'success',
        title: 'Transaction Approved',
        message: 'Transaction TRX-2024-0231 has been approved by Ahmed Al-Rashid',
        timestamp: new Date(Date.now() - 60 * 60000), // 1 hour ago
        read: false
    },
    {
        id: 3,
        type: 'user',
        icon: 'bi-person-plus',
        iconColor: 'info',
        title: 'New User Added',
        message: 'Sarah Mitchell has been added as an Editor',
        timestamp: new Date(Date.now() - 3 * 3600000), // 3 hours ago
        read: true
    },
    {
        id: 4,
        type: 'system',
        icon: 'bi-exclamation-triangle',
        iconColor: 'warning',
        title: 'System Maintenance',
        message: 'Scheduled maintenance will begin at 2:00 AM',
        timestamp: new Date(Date.now() - 24 * 3600000), // Yesterday
        read: true
    },
    {
        id: 5,
        type: 'error',
        icon: 'bi-x-circle',
        iconColor: 'danger',
        title: 'Transaction Failed',
        message: 'Transaction TRX-2024-0229 failed due to insufficient balance',
        timestamp: new Date(Date.now() - 36 * 3600000), // Yesterday
        read: false
    }
];

// Initialize notifications
document.addEventListener('DOMContentLoaded', function() {
    updateNotificationBadge();
    loadNotificationDropdown();
    
    // Add click handlers for notification buttons
    setupNotificationHandlers();
});

// Update notification badge count
function updateNotificationBadge() {
    const unreadCount = getUnreadCount();
    const badges = document.querySelectorAll('.notification-badge');
    
    badges.forEach(badge => {
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    });
}

// Get unread notifications count
function getUnreadCount() {
    const savedNotifications = getSavedNotifications();
    return savedNotifications.filter(n => !n.read).length;
}

// Get saved notifications from localStorage
function getSavedNotifications() {
    const saved = localStorage.getItem('notifications');
    return saved ? JSON.parse(saved) : notificationsData;
}

// Save notifications to localStorage
function saveNotifications(notifications) {
    localStorage.setItem('notifications', JSON.stringify(notifications));
}

// Load notifications in dropdown
function loadNotificationDropdown() {
    const dropdownLists = document.querySelectorAll('.notification-dropdown .notification-list');
    const notifications = getSavedNotifications();
    const recentNotifications = notifications.slice(0, 5);
    
    dropdownLists.forEach(list => {
        list.innerHTML = '';
        
        if (recentNotifications.length === 0) {
            list.innerHTML = `
                <div class="notifications-empty p-3">
                    <i class="bi bi-bell-slash"></i>
                    <p class="mb-0" data-original-text="No notifications">No notifications</p>
                </div>
            `;
        } else {
            recentNotifications.forEach(notification => {
                const item = createDropdownNotificationItem(notification);
                list.appendChild(item);
            });
        }
    });
}

// Create dropdown notification item
function createDropdownNotificationItem(notification) {
    const div = document.createElement('div');
    div.className = `notification-item-mini ${notification.read ? '' : 'unread'}`;
    div.innerHTML = `
        <div class="d-flex">
            <div class="notification-icon small bg-${notification.iconColor}-subtle text-${notification.iconColor} rounded-circle me-2">
                <i class="bi ${notification.icon}"></i>
            </div>
            <div class="flex-grow-1">
                <div class="fw-semibold small" data-original-text="${notification.title}">${notification.title}</div>
                <div class="text-muted small text-truncate" data-original-text="${notification.message}">${notification.message}</div>
                <small class="text-muted">${formatTimestamp(notification.timestamp)}</small>
            </div>
        </div>
    `;
    
    div.addEventListener('click', function() {
        markAsRead(notification.id);
        window.location.href = 'notifications.html';
    });
    
    return div;
}

// Format timestamp
function formatTimestamp(timestamp) {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) {
        return 'Just now';
    } else if (minutes < 60) {
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (days < 7) {
        return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
        return new Date(timestamp).toLocaleDateString();
    }
}

// Mark notification as read
function markAsRead(notificationId) {
    const notifications = getSavedNotifications();
    const notification = notifications.find(n => n.id === notificationId);
    
    if (notification && !notification.read) {
        notification.read = true;
        saveNotifications(notifications);
        updateNotificationBadge();
        loadNotificationDropdown();
        
        // Update the notification item in the page if exists
        const item = document.querySelector(`[data-notification-id="${notificationId}"]`);
        if (item) {
            item.classList.remove('unread');
        }
    }
}

// Mark all notifications as read
function markAllAsRead() {
    const notifications = getSavedNotifications();
    notifications.forEach(n => n.read = true);
    saveNotifications(notifications);
    updateNotificationBadge();
    loadNotificationDropdown();
    
    // Update all items in the page
    document.querySelectorAll('.notification-item.unread').forEach(item => {
        item.classList.remove('unread');
    });
    
    showToast('All notifications marked as read', 'success');
}

// Clear all notifications
function clearAllNotifications() {
    if (confirm('Are you sure you want to clear all notifications?')) {
        localStorage.removeItem('notifications');
        updateNotificationBadge();
        loadNotificationDropdown();
        
        // Reload page if on notifications page
        if (window.location.pathname.includes('notifications.html')) {
            window.location.reload();
        }
        
        showToast('All notifications cleared', 'success');
    }
}

// Delete single notification
function deleteNotification(notificationId) {
    const notifications = getSavedNotifications();
    const index = notifications.findIndex(n => n.id === notificationId);
    
    if (index !== -1) {
        notifications.splice(index, 1);
        saveNotifications(notifications);
        updateNotificationBadge();
        loadNotificationDropdown();
        
        // Remove from page
        const item = document.querySelector(`[data-notification-id="${notificationId}"]`);
        if (item) {
            item.remove();
        }
        
        showToast('Notification deleted', 'success');
    }
}

// Show notification settings modal
function showNotificationSettings() {
    const modal = new bootstrap.Modal(document.getElementById('notificationSettingsModal'));
    modal.show();
}

// Setup notification handlers
function setupNotificationHandlers() {
    // Mark all as read button in dropdown
    document.querySelectorAll('.notification-dropdown .dropdown-header a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            markAllAsRead();
        });
    });
}

// Show toast notification
function showToast(message, type = 'info') {
    // Create toast container if doesn't exist
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    // Create toast
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center border-0';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    const bgClass = type === 'success' ? 'bg-success' : 
                   type === 'danger' ? 'bg-danger' : 
                   type === 'warning' ? 'bg-warning' : 'bg-info';
    
    toast.innerHTML = `
        <div class="d-flex ${bgClass} text-white">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Show toast
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remove after hidden
    toast.addEventListener('hidden.bs.toast', function() {
        toast.remove();
    });
}

// Simulate receiving new notification (for demo)
function simulateNewNotification() {
    const notifications = getSavedNotifications();
    const newNotification = {
        id: Date.now(),
        type: 'transaction',
        icon: 'bi-bell',
        iconColor: 'primary',
        title: 'New Notification',
        message: 'This is a new notification received just now',
        timestamp: new Date(),
        read: false
    };
    
    notifications.unshift(newNotification);
    saveNotifications(notifications);
    updateNotificationBadge();
    loadNotificationDropdown();
    
    showToast('New notification received!', 'info');
}

// Filter notifications by type
function filterNotifications(type) {
    const notifications = getSavedNotifications();
    
    if (type === 'unread') {
        return notifications.filter(n => !n.read);
    } else if (type === 'all') {
        return notifications;
    } else {
        return notifications.filter(n => n.type === type);
    }
}

// Initialize real-time updates (simulate with interval)
setInterval(function() {
    // Check for new notifications every 30 seconds
    // In production, this would be replaced with WebSocket or SSE
    updateNotificationBadge();
}, 30000);

// Export functions for use in other scripts
window.notificationFunctions = {
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    deleteNotification,
    showNotificationSettings,
    simulateNewNotification,
    showToast
};