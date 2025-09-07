#!/usr/bin/env python3
import os
import re

# Standard header template
STANDARD_HEADER = """    <!-- Header -->
    <header class="header">
        <div class="container-fluid px-4">
            <div class="d-flex justify-content-between align-items-center">
                <!-- Left Section -->
                <div class="d-flex align-items-center gap-3">
                    <button class="btn btn-link text-dark p-0 d-lg-none" id="sidebarToggle">
                        <i class="bi bi-list fs-4"></i>
                    </button>
                    <div class="logo">
                        <img src="MDC-logo-Black.png" alt="MDC Logo" height="40">
                    </div>
                    <h1 class="h5 mb-0 text-muted d-none d-md-block">Transaction Tracking System</h1>
                </div>
                
                <!-- Right Section -->
                <div class="d-flex align-items-center gap-3">
                    <!-- Search -->
                    <div class="search-box d-none d-md-block">
                        <div class="input-group">
                            <span class="input-group-text bg-transparent border-0">
                                <i class="bi bi-search text-muted"></i>
                            </span>
                            <input type="text" class="form-control border-0 bg-transparent" placeholder="Search transactions...">
                        </div>
                    </div>
                    
                    <!-- Notifications -->
                    <button class="btn btn-link text-dark p-2 position-relative">
                        <i class="bi bi-bell fs-5"></i>
                        <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                            5
                        </span>
                    </button>
                    
                    <!-- Language Toggle -->
                    <div class="language-toggle">
                        <button class="btn btn-sm btn-outline-secondary" data-lang="en">EN</button>
                        <button class="btn btn-sm btn-outline-secondary active" data-lang="ar">AR</button>
                    </div>
                    
                    <!-- User Menu -->
                    <div class="dropdown">
                        <button class="btn btn-link text-dark p-0 d-flex align-items-center gap-2" data-bs-toggle="dropdown">
                            <div class="user-avatar">
                                <i class="bi bi-person-circle fs-3"></i>
                            </div>
                            <div class="text-start d-none d-lg-block">
                                <div class="fw-semibold" id="userName">User</div>
                                <small class="text-muted" id="userRole">Role</small>
                            </div>
                            <i class="bi bi-chevron-down"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><a class="dropdown-item" href="#"><i class="bi bi-person me-2"></i> Profile</a></li>
                            <li><a class="dropdown-item" href="#"><i class="bi bi-gear me-2"></i> Settings</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-danger" href="index.html"><i class="bi bi-box-arrow-right me-2"></i> Logout</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </header>"""

# Files to update (excluding dashboards and test files)
files_to_update = [
    'transactions.html',
    'transaction-form.html',
    'transaction-detail.html',
    'reports.html',
    'assignments.html',
    'email-templates.html',
    'audit-logs.html'
]

def update_header(filepath):
    """Update header in HTML file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pattern to match the entire header section
    pattern = r'(    <!-- Header -->.*?</header>)'
    
    # Replace with standard header
    updated_content = re.sub(pattern, STANDARD_HEADER, content, flags=re.DOTALL)
    
    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(updated_content)
    
    print(f"Updated: {filepath}")

# Update all files
for filename in files_to_update:
    filepath = f'/home/kms/dev/mdc-v2/mdc-tts-prototype/{filename}'
    if os.path.exists(filepath):
        try:
            update_header(filepath)
        except Exception as e:
            print(f"Error updating {filename}: {e}")
    else:
        print(f"File not found: {filename}")

print("\nAll headers updated successfully!")