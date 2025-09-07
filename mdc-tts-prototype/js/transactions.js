// Transactions Page JavaScript
// Version 4.0 - Property/Real Estate Types with Arabic Support
console.log('%c MDC TTS Transactions v4.0 - Property Types: التسجيل، نقل الملكية، تراخيص، تصاميم، دراسة ', 'background: #1a5f3f; color: white; font-weight: bold; padding: 5px;');

// Sample transaction data
const sampleTransactions = [
    {
        id: 'TRX-2024-001',
        externalId: 'REG-2024-001',
        client: 'Ahmed Al-Rashid',
        type: 'Registration',
        priority: 'high',
        status: 'completed',
        date: '2024-01-15',
        creationDate: '2024-01-10',
        attachments: 3,
        description: 'Property registration for villa in Al-Riyadh district',
        comments: [
            { author: 'Ahmed Al-Rashid', text: 'Please review the registration documents', timestamp: '2024-01-14 10:30' },
            { author: 'John Editor', text: 'Registration has been approved', timestamp: '2024-01-15 09:15' }
        ]
    },
    {
        id: 'TRX-2024-002',
        client: 'Fatima Al-Zahrani',
        type: 'OwnershipTransfer',
        priority: 'medium',
        status: 'pending',
        date: '2024-01-15',
        attachments: 1,
        description: 'Ownership transfer for apartment unit'
    },
    {
        id: 'TRX-2024-003',
        client: 'Mohammed Al-Qahtani',
        type: 'Licenses',
        priority: 'low',
        status: 'in-progress',
        date: '2024-01-14',
        attachments: 2,
        description: 'Building permit license application'
    },
    {
        id: 'TRX-2024-004',
        client: 'Sara Al-Mutairi',
        type: 'Designs',
        priority: 'urgent',
        status: 'approved',
        date: '2024-01-14',
        attachments: 4,
        description: 'Architectural design plans for commercial complex'
    },
    {
        id: 'TRX-2024-005',
        client: 'Abdullah Al-Dosari',
        type: 'Study',
        priority: 'medium',
        status: 'draft',
        date: '2024-01-13',
        attachments: 0,
        description: 'Feasibility study for new development project'
    },
    {
        id: 'TRX-2024-006',
        client: 'Layla Al-Harbi',
        type: 'Registration',
        priority: 'high',
        status: 'completed',
        date: '2024-01-13',
        attachments: 5,
        description: 'Land registration for plot #4567'
    },
    {
        id: 'TRX-2024-007',
        client: 'Omar Al-Shammari',
        type: 'OwnershipTransfer',
        priority: 'medium',
        status: 'submitted',
        date: '2024-01-12',
        attachments: 2,
        description: 'Ownership transfer for residential property'
    },
    {
        id: 'TRX-2024-008',
        client: 'Noura Al-Otaibi',
        type: 'Licenses',
        priority: 'urgent',
        status: 'on-hold',
        date: '2024-01-12',
        attachments: 1,
        description: 'Commercial license - verification needed'
    },
    {
        id: 'TRX-2024-009',
        client: 'Khalid Al-Rasheed',
        type: 'Designs',
        priority: 'low',
        status: 'cancelled',
        date: '2024-01-11',
        attachments: 3,
        description: 'Cancelled interior design proposal'
    },
    {
        id: 'TRX-2024-010',
        client: 'Maha Al-Sulaiman',
        type: 'Study',
        priority: 'high',
        status: 'completed',
        date: '2024-01-11',
        attachments: 6,
        description: 'Environmental impact assessment study'
    }
];

let currentPage = 1;
let pageSize = 25;
let sortColumn = 'date';
let sortDirection = 'desc';
let filteredTransactions = [...sampleTransactions];
let viewMode = 'table';

// Helper function to render action buttons based on user role (Table View)
function renderActionButtonsByRole(transactionId) {
    const userData = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || '{}');
    
    if (userData.role === 'client') {
        // Client: Only feedback and download buttons
        return `
            <button class="btn btn-sm btn-outline-success" onclick="addFeedback('${transactionId}')" title="Add Feedback" data-original-title="Add Feedback">
                <i class="bi bi-chat-dots"></i>
            </button>
            <button class="btn btn-sm btn-outline-primary" onclick="downloadTransaction('${transactionId}')" title="Download" data-original-title="Download">
                <i class="bi bi-download"></i>
            </button>
        `;
    } else {
        // Editor/Admin: Full buttons including edit
        return `
            <button class="btn btn-sm btn-outline-primary" onclick="editTransaction('${transactionId}')" title="Edit" data-original-title="Edit">
                <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-primary" onclick="downloadTransaction('${transactionId}')" title="Download" data-original-title="Download">
                <i class="bi bi-download"></i>
            </button>
        `;
    }
}

// Helper function for grid view action buttons
function renderGridActionButtonsByRole(transactionId) {
    const userData = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || '{}');
    
    if (userData.role === 'client') {
        // Client: Only feedback and download buttons
        return `
            <button class="btn btn-sm btn-outline-success" onclick="event.stopPropagation(); addFeedback('${transactionId}')">
                <i class="bi bi-chat-dots"></i>
            </button>
            <button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation(); downloadTransaction('${transactionId}')">
                <i class="bi bi-download"></i>
            </button>
        `;
    } else {
        // Editor/Admin: Edit and download
        return `
            <button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation(); editTransaction('${transactionId}')">
                <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation(); downloadTransaction('${transactionId}')">
                <i class="bi bi-download"></i>
            </button>
        `;
    }
}

// Client feedback function
function addFeedback(transactionId) {
    const modal = new bootstrap.Modal(document.getElementById('feedbackModal') || createFeedbackModal());
    document.getElementById('feedbackTransactionId').value = transactionId;
    modal.show();
}

// Create feedback modal if it doesn't exist
function createFeedbackModal() {
    const modalHtml = `
        <div class="modal fade" id="feedbackModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" data-original-text="Add Feedback">Add Feedback</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <input type="hidden" id="feedbackTransactionId">
                        <div class="mb-3">
                            <label class="form-label" data-original-text="Your Feedback">Your Feedback</label>
                            <textarea class="form-control" rows="4" id="feedbackText" 
                                placeholder="Enter your feedback or questions..." 
                                data-original-placeholder="Enter your feedback or questions..."></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <span data-original-text="Cancel">Cancel</span>
                        </button>
                        <button type="button" class="btn btn-primary" onclick="submitFeedback()">
                            <span data-original-text="Submit Feedback">Submit Feedback</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    return document.getElementById('feedbackModal');
}

// Submit feedback function
function submitFeedback() {
    const transactionId = document.getElementById('feedbackTransactionId').value;
    const feedbackText = document.getElementById('feedbackText').value;
    
    if (feedbackText.trim()) {
        console.log('Feedback submitted for', transactionId, ':', feedbackText);
        // In real app, this would send to backend
        alert('Feedback submitted successfully!');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('feedbackModal'));
        modal.hide();
        
        // Clear form
        document.getElementById('feedbackText').value = '';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initializeTransactionsPage();
});

function initializeTransactionsPage() {
    console.log('MDC TTS v2.0 - Transactions Page with Priority Badges');
    console.log('First transaction data:', sampleTransactions[0]);
    
    // Check user role and setup page accordingly
    const userData = checkAuth();
    if (!userData) return;
    
    setupSidebarForRole(userData.role);
    setupPagePermissions(userData.role);
    
    // Initialize table
    loadTransactions();
    
    // Setup event listeners
    setupEventListeners();
}

function setupSidebarForRole(role) {
    const sidebarNav = document.getElementById('sidebarNav');
    if (!sidebarNav) return;
    
    let navItems = '';
    
    if (role === 'admin') {
        navItems = `
            <li class="nav-item">
                <a class="nav-link" href="dashboard-admin.html">
                    <i class="bi bi-speedometer2"></i>
                    <span>Dashboard</span>
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link active" href="transactions.html">
                    <i class="bi bi-receipt"></i>
                    <span>All Transactions</span>
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="users.html">
                    <i class="bi bi-people"></i>
                    <span>User Management</span>
                </a>
            </li>
        `;
    } else if (role === 'editor') {
        navItems = `
            <li class="nav-item">
                <a class="nav-link" href="dashboard-editor.html">
                    <i class="bi bi-speedometer2"></i>
                    <span>Dashboard</span>
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link active" href="transactions.html">
                    <i class="bi bi-receipt"></i>
                    <span>My Transactions</span>
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="create-transaction.html">
                    <i class="bi bi-plus-square"></i>
                    <span>Create New</span>
                </a>
            </li>
        `;
    } else {
        navItems = `
            <li class="nav-item">
                <a class="nav-link" href="dashboard-client.html">
                    <i class="bi bi-speedometer2"></i>
                    <span>Dashboard</span>
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link active" href="transactions.html">
                    <i class="bi bi-receipt"></i>
                    <span>My Transactions</span>
                </a>
            </li>
        `;
    }
    
    sidebarNav.innerHTML = navItems;
}

function setupPagePermissions(role) {
    // Hide/show elements based on role
    const newTransactionBtn = document.getElementById('newTransactionBtn');
    const userData = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || '{}');
    
    if (role === 'client') {
        // Clients can't create transactions
        if (newTransactionBtn) newTransactionBtn.style.display = 'none';
        
        // Hide checkbox column
        document.querySelectorAll('th:first-child, td:first-child').forEach(el => {
            el.style.display = 'none';
        });
        
        // CRITICAL: Filter to show only client's own transactions
        filteredTransactions = sampleTransactions.filter(t => 
            t.client === userData.name
        );
    } else if (role === 'editor') {
        // Editors see assigned transactions
        filteredTransactions = sampleTransactions.filter(t => 
            ['TRX-2024-001', 'TRX-2024-002', 'TRX-2024-003'].includes(t.id)
        );
    } else {
        // Admin sees all
        filteredTransactions = [...sampleTransactions];
    }
}

function setupEventListeners() {
    // Search input
    document.getElementById('searchInput')?.addEventListener('input', debounce(filterTransactions, 300));
    
    // Filter selects
    document.getElementById('statusFilter')?.addEventListener('change', filterTransactions);
    document.getElementById('typeFilter')?.addEventListener('change', filterTransactions);
    document.getElementById('dateFrom')?.addEventListener('change', filterTransactions);
    document.getElementById('dateTo')?.addEventListener('change', filterTransactions);
    
    // Page size
    document.getElementById('pageSize')?.addEventListener('change', function() {
        pageSize = parseInt(this.value);
        currentPage = 1;
        loadTransactions();
    });
    
    // Sort columns
    document.querySelectorAll('.sortable').forEach(th => {
        th.addEventListener('click', function() {
            const column = this.dataset.sort;
            if (sortColumn === column) {
                sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                sortColumn = column;
                sortDirection = 'asc';
            }
            
            // Update UI
            document.querySelectorAll('.sortable').forEach(el => {
                el.classList.remove('asc', 'desc');
            });
            this.classList.add(sortDirection);
            
            loadTransactions();
        });
    });
    
    // Select all checkbox
    document.getElementById('selectAll')?.addEventListener('change', function() {
        document.querySelectorAll('.transaction-checkbox').forEach(cb => {
            cb.checked = this.checked;
        });
    });
    
    // View mode toggle
    document.querySelectorAll('[data-view]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('View toggle clicked:', this.dataset.view);
            document.querySelectorAll('[data-view]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            viewMode = this.dataset.view;
            console.log('Switching to view mode:', viewMode);
            loadTransactions();
        });
    });
    
    // New transaction button
    document.getElementById('newTransactionBtn')?.addEventListener('click', function() {
        window.location.href = 'create-transaction.html';
    });
}

function loadTransactions() {
    console.log('Loading transactions in', viewMode, 'mode');
    
    // Sort transactions
    const sorted = [...filteredTransactions].sort((a, b) => {
        let aVal = a[sortColumn];
        let bVal = b[sortColumn];
        
        if (sortColumn === 'amount') {
            aVal = parseFloat(aVal);
            bVal = parseFloat(bVal);
        }
        
        if (sortDirection === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });
    
    // Paginate
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const paginated = sorted.slice(start, end);
    
    // Render based on view mode
    if (viewMode === 'table') {
        renderTableView(paginated);
    } else {
        renderGridView(paginated);
    }
    
    // Update pagination info
    updatePaginationInfo(sorted.length, start + 1, Math.min(end, sorted.length));
}

function renderTableView(transactions) {
    console.log('MDC TTS - Rendering table view with', transactions.length, 'transactions');
    
    // Get user role
    const userData = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || '{}');
    const isClient = userData.role === 'client';
    
    // Find the container (might be table-responsive or the grid container)
    let container = document.querySelector('.table-responsive');
    if (!container) {
        // If table-responsive doesn't exist, find the card-body that contains our content
        const cardBody = document.querySelector('.card-body.p-0');
        if (!cardBody) {
            console.error('No container found for table view');
            return;
        }
        // Create table-responsive container
        cardBody.innerHTML = '<div class="table-responsive"></div>';
        container = cardBody.querySelector('.table-responsive');
    }
    
    // Build the complete table HTML structure - hide Client and Priority columns for Client users
    const tableHTML = `
        <table class="table table-hover table-mobile-card mb-0" id="transactionsTable">
            <thead>
                <tr>
                    <th>
                        <input type="checkbox" class="form-check-input" id="selectAll">
                    </th>
                    <th data-original-text="Transaction ID">رقم المعاملة</th>
                    <th data-original-text="Reference Number">الرقم المرجعي</th>
                    ${!isClient ? '<th data-original-text="Client">العميل</th>' : ''}
                    <th data-original-text="Type">النوع</th>
                    ${!isClient ? '<th data-original-text="Priority">الأولوية</th>' : ''}
                    <th data-original-text="Status">الحالة</th>
                    <th data-original-text="Date">التاريخ</th>
                    <th data-original-text="Attachments">المرفقات</th>
                    <th data-original-text="Actions">الإجراءات</th>
                </tr>
            </thead>
            <tbody id="transactionTableBody">
                ${transactions.length === 0 ? `
                    <tr>
                        <td colspan="10" class="text-center py-5">
                            <div class="empty-state">
                                <i class="bi bi-inbox empty-state-icon"></i>
                                <h5 class="empty-state-title">No transactions found</h5>
                                <p class="empty-state-text">Try adjusting your filters or search criteria</p>
                            </div>
                        </td>
                    </tr>
                ` : transactions.map(t => {
                    // Generate reference number (use externalId if available, otherwise create one)
                    const referenceNumber = t.externalId || `REF-${t.id.replace('TRX-', '')}`;
                    return `
        <tr>
            <td>
                <input type="checkbox" class="form-check-input transaction-checkbox" value="${t.id}">
            </td>
            <td>
                <a href="transaction-detail.html?id=${t.id}" class="text-decoration-none">
                    #${t.id}
                </a>
            </td>
            <td class="text-muted">${referenceNumber}</td>
            ${!isClient ? `<td>${t.client}</td>` : ''}
            <td>${getTypeBadge(t.type)}</td>
            ${!isClient ? `<td>${getPriorityBadge(t.priority || 'medium')}</td>` : ''}
            <td>${getStatusBadge(t.status)}</td>
            <td>${formatDate(t.date)}</td>
            <td>
                ${t.attachments > 0 ? `
                    <span class="attachment-count">
                        <i class="bi bi-paperclip"></i>
                        ${t.attachments}
                    </span>
                ` : '-'}
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-outline-primary" onclick="viewTransaction('${t.id}')" title="View" data-original-title="View">
                        <i class="bi bi-eye"></i>
                    </button>
                    ${renderActionButtonsByRole(t.id)}
                </div>
            </td>
        </tr>
                `;}).join('')}
            </tbody>
        </table>
    `;
    
    // Set the complete table HTML
    container.innerHTML = tableHTML;
    
    // Re-attach select all checkbox listener
    const selectAll = document.getElementById('selectAll');
    if (selectAll) {
        selectAll.addEventListener('change', function() {
            document.querySelectorAll('.transaction-checkbox').forEach(cb => {
                cb.checked = this.checked;
            });
        });
    }
}

function renderGridView(transactions) {
    console.log('MDC TTS - Rendering grid view with', transactions.length, 'transactions');
    
    // Get user role
    const userData = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || '{}');
    const isClient = userData.role === 'client';
    
    // Find the table's parent container
    const tableContainer = document.querySelector('.table-responsive');
    if (!tableContainer) {
        console.error('Table container not found');
        return;
    }
    const container = tableContainer;
    
    if (transactions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-inbox empty-state-icon"></i>
                <h5 class="empty-state-title">No transactions found</h5>
                <p class="empty-state-text">Try adjusting your filters or search criteria</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="transactions-grid p-3">
            ${transactions.map(t => {
                const referenceNumber = t.externalId || `REF-${t.id.replace('TRX-', '')}`;
                return `
                <div class="transaction-card" onclick="viewTransaction('${t.id}')">
                    <div class="transaction-card-header">
                        <a href="transaction-detail.html?id=${t.id}" class="transaction-card-id">
                            #${t.id}
                        </a>
                        ${getStatusBadge(t.status)}
                    </div>
                    <div class="transaction-card-body">
                        <div class="transaction-card-row">
                            <span class="transaction-card-label" data-original-text="Reference Number">الرقم المرجعي</span>
                            <span class="transaction-card-value text-muted">${referenceNumber}</span>
                        </div>
                        ${!isClient ? `
                        <div class="transaction-card-row">
                            <span class="transaction-card-label" data-original-text="Client">العميل</span>
                            <span class="transaction-card-value">${t.client}</span>
                        </div>
                        ` : ''}
                        <div class="transaction-card-row">
                            <span class="transaction-card-label" data-original-text="Type">النوع</span>
                            <span class="transaction-card-value">${getTypeBadge(t.type)}</span>
                        </div>
                        ${!isClient ? `
                        <div class="transaction-card-row">
                            <span class="transaction-card-label" data-original-text="Priority">الأولوية</span>
                            <span class="transaction-card-value">${getPriorityBadge(t.priority || 'medium')}</span>
                        </div>
                        ` : ''}
                        <div class="transaction-card-row">
                            <span class="transaction-card-label" data-original-text="Date">التاريخ</span>
                            <span class="transaction-card-value">${formatDate(t.date)}</span>
                        </div>
                    </div>
                    <div class="transaction-card-footer">
                        <span class="attachment-count">
                            <i class="bi bi-paperclip"></i>
                            ${t.attachments}
                        </span>
                        <div class="action-buttons" onclick="event.stopPropagation();">
                            ${renderGridActionButtonsByRole(t.id)}
                        </div>
                    </div>
                </div>
            `;}).join('')}
        </div>
    `;
}

function getStatusBadge(status) {
    const statusConfig = {
        'draft': { class: 'secondary', label: 'Draft', labelAr: 'مسودة' },
        'submitted': { class: 'info', label: 'Submitted', labelAr: 'مُرسل' },
        'approved': { class: 'primary', label: 'Approved', labelAr: 'موافق عليه' },
        'in-progress': { class: 'info', label: 'In Progress', labelAr: 'قيد التنفيذ' },
        'pending': { class: 'warning', label: 'Pending', labelAr: 'معلق' },
        'paid': { class: 'success', label: 'Paid', labelAr: 'مدفوع' },
        'completed': { class: 'success', label: 'Completed', labelAr: 'مكتمل' },
        'cancelled': { class: 'danger', label: 'Cancelled', labelAr: 'ملغى' },
        'on-hold': { class: 'warning', label: 'On Hold', labelAr: 'مُعلق' }
    };
    
    const config = statusConfig[status] || { class: 'secondary', label: status, labelAr: status };
    // Always show Arabic since page defaults to Arabic
    const label = config.labelAr;
    return `<span class="badge bg-${config.class}" data-original-text="${config.label}">${label}</span>`;
}

function getPriorityBadge(priority) {
    const priorityConfig = {
        'urgent': { class: 'danger', label: 'Urgent', labelAr: 'عاجل', icon: 'bi-exclamation-circle-fill' },
        'high': { class: 'warning', label: 'High', labelAr: 'عالية', icon: 'bi-arrow-up-circle-fill' },
        'medium': { class: 'info', label: 'Medium', labelAr: 'متوسطة', icon: 'bi-dash-circle' },
        'low': { class: 'secondary', label: 'Low', labelAr: 'منخفضة', icon: 'bi-arrow-down-circle' }
    };
    
    const config = priorityConfig[priority] || { class: 'secondary', label: 'Medium', labelAr: 'متوسطة' };
    // Always show Arabic since page defaults to Arabic
    const label = config.labelAr;
    return `<span class="badge bg-${config.class}" data-original-text="${config.label}">
        ${config.icon ? `<i class="${config.icon} me-1"></i>` : ''}${label}
    </span>`;
}

function getTypeBadge(type) {
    const typeConfig = {
        'Registration': { label: 'Registration', labelAr: 'التسجيل', icon: 'bi-card-checklist' },
        'OwnershipTransfer': { label: 'Ownership Transfer', labelAr: 'نقل الملكية', icon: 'bi-arrow-left-right' },
        'Licenses': { label: 'Licenses', labelAr: 'تراخيص', icon: 'bi-file-earmark-check' },
        'Designs': { label: 'Designs', labelAr: 'تصاميم', icon: 'bi-palette' },
        'Study': { label: 'Study', labelAr: 'دراسة', icon: 'bi-journal-text' },
        // Map old types to new ones for backward compatibility
        'Invoice': { label: 'Registration', labelAr: 'التسجيل', icon: 'bi-card-checklist' },
        'Payment': { label: 'Ownership Transfer', labelAr: 'نقل الملكية', icon: 'bi-arrow-left-right' },
        'Refund': { label: 'Licenses', labelAr: 'تراخيص', icon: 'bi-file-earmark-check' },
        'Transfer': { label: 'Designs', labelAr: 'تصاميم', icon: 'bi-palette' },
        'Other': { label: 'Study', labelAr: 'دراسة', icon: 'bi-journal-text' }
    };
    
    const config = typeConfig[type] || { label: type, labelAr: type };
    // Always show Arabic since page defaults to Arabic
    const label = config.labelAr;
    return `<span data-original-text="${config.label}">
        ${config.icon ? `<i class="${config.icon} me-1"></i>` : ''}${label}
    </span>`;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function filterTransactions() {
    const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const status = document.getElementById('statusFilter')?.value || '';
    const type = document.getElementById('typeFilter')?.value || '';
    const dateFrom = document.getElementById('dateFrom')?.value || '';
    const dateTo = document.getElementById('dateTo')?.value || '';
    
    filteredTransactions = sampleTransactions.filter(t => {
        // Search filter
        if (search && !(
            t.id.toLowerCase().includes(search) ||
            t.client.toLowerCase().includes(search) ||
            t.description.toLowerCase().includes(search)
        )) return false;
        
        // Status filter
        if (status && t.status !== status) return false;
        
        // Type filter
        if (type && t.type.toLowerCase() !== type) return false;
        
        // Date range filter
        if (dateFrom && t.date < dateFrom) return false;
        if (dateTo && t.date > dateTo) return false;
        
        return true;
    });
    
    currentPage = 1;
    loadTransactions();
    updateActiveFilters();
}

function updateActiveFilters() {
    const container = document.getElementById('activeFilters');
    if (!container) return;
    
    const filters = [];
    
    const search = document.getElementById('searchInput')?.value;
    if (search) filters.push({ label: `Search: ${search}`, id: 'search' });
    
    const status = document.getElementById('statusFilter')?.value;
    if (status) filters.push({ label: `Status: ${status}`, id: 'status' });
    
    const type = document.getElementById('typeFilter')?.value;
    if (type) filters.push({ label: `Type: ${type}`, id: 'type' });
    
    container.innerHTML = filters.map(f => `
        <span class="filter-tag">
            ${f.label}
            <i class="bi bi-x remove-filter" onclick="removeFilter('${f.id}')"></i>
        </span>
    `).join('');
}

function removeFilter(filterId) {
    switch(filterId) {
        case 'search':
            document.getElementById('searchInput').value = '';
            break;
        case 'status':
            document.getElementById('statusFilter').value = '';
            break;
        case 'type':
            document.getElementById('typeFilter').value = '';
            break;
    }
    filterTransactions();
}

function updatePaginationInfo(total, from, to) {
    document.getElementById('showingFrom').textContent = from;
    document.getElementById('showingTo').textContent = to;
    document.getElementById('totalEntries').textContent = total;
}

function viewTransaction(id) {
    window.location.href = `transaction-detail.html?id=${id}`;
}

function editTransaction(id) {
    window.location.href = `edit-transaction.html?id=${id}`;
}

function downloadTransaction(id) {
    // Simulate download
    showNotification(`Downloading transaction ${id}...`, 'info');
}

function exportTransactions() {
    // Simulate export
    showNotification('Preparing export...', 'info');
    setTimeout(() => {
        showNotification('Export completed successfully!', 'success');
    }, 2000);
}

function refreshTable() {
    console.log('Refreshing transactions view');
    loadTransactions();
    const message = viewMode === 'table' ? 'Table refreshed' : 'Grid refreshed';
    showNotification(message, 'info');
}

function applyAdvancedFilters() {
    // Apply advanced filters logic
    const modal = bootstrap.Modal.getInstance(document.getElementById('filterModal'));
    modal.hide();
    filterTransactions();
    showNotification('Advanced filters applied', 'success');
}

function clearAdvancedFilters() {
    document.getElementById('advancedFilterForm').reset();
    filterTransactions();
}