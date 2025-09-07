#!/bin/bash

# List of HTML files that need updating
files=(
    "audit-logs.html"
    "transaction-form.html"
    "reports.html"
    "assignments.html"
    "notifications.html"
    "email-templates.html"
    "transactions.html"
    "transaction-detail.html"
)

# Update each file
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "Updating $file..."
        # Replace placeholder User with Admin User
        sed -i 's/<div class="fw-semibold" id="userName">User<\/div>/<div class="fw-semibold" id="userName">Admin User<\/div>/g' "$file"
        # Replace placeholder Role with Admin
        sed -i 's/<small class="text-muted" id="userRole">Role<\/small>/<small class="text-muted" id="userRole">Admin<\/small>/g' "$file"
        
        # Also update for class-based selectors
        sed -i 's/<div class="fw-semibold user-name">User<\/div>/<div class="fw-semibold user-name">Admin User<\/div>/g' "$file"
        sed -i 's/<small class="text-muted user-role">Role<\/small>/<small class="text-muted user-role">Admin<\/small>/g' "$file"
    fi
done

echo "All files updated successfully!"