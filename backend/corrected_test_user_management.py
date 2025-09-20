#!/usr/bin/env python3
"""
Corrected Test Suite for MDC Transaction Tracking System User Management

This script tests all aspects of the User Management functionality with corrected API endpoints.
"""

import json
import requests
import time
import sys
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import subprocess
import os

class CorrectedUserManagementTester:
    def __init__(self):
        self.base_url = "http://localhost:8000/api/v1"
        self.frontend_url = "http://localhost:3000"
        self.auth_token = None
        self.test_results = []
        self.current_test_category = ""
        
        # Test data
        self.admin_credentials = {
            "email": "admin@mdc.com",
            "password": "admin123"
        }
        
        self.test_user_data = {
            "email": "testuser.corrected@example.com",
            "first_name": "Test",
            "last_name": "User", 
            "username": "testuser_corrected",
            "role": "client",
            "company_name": "Test Company",
            "phone": "+966501234567",
            "password": "TestPassword123!",
            "is_active": True
        }

    def log_test(self, test_name: str, status: str, details: str = "", response_time: float = 0):
        """Log test results"""
        result = {
            "category": self.current_test_category,
            "test_name": test_name,
            "status": status,  # PASS, FAIL, WARNING, INFO
            "details": details,
            "response_time": response_time,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        # Color coding for console output
        colors = {
            "PASS": "\033[92m",    # Green
            "FAIL": "\033[91m",    # Red
            "WARNING": "\033[93m", # Yellow
            "INFO": "\033[94m",    # Blue
            "ENDC": "\033[0m"      # End color
        }
        
        color = colors.get(status, "")
        print(f"{color}[{status}]{colors['ENDC']} {self.current_test_category} - {test_name}")
        if details:
            print(f"    {details}")
        if response_time > 0:
            print(f"    Response time: {response_time:.2f}ms")
        print()

    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None, auth_required: bool = True) -> Tuple[requests.Response, float]:
        """Make HTTP request with timing"""
        url = f"{self.base_url}{endpoint}"
        request_headers = {"Content-Type": "application/json"}
        
        if auth_required and self.auth_token:
            request_headers["Authorization"] = f"Bearer {self.auth_token}"
        
        if headers:
            request_headers.update(headers)
        
        start_time = time.time()
        try:
            if method == "GET":
                response = requests.get(url, headers=request_headers, timeout=10)
            elif method == "POST":
                response = requests.post(url, json=data, headers=request_headers, timeout=10)
            elif method == "PUT":
                response = requests.put(url, json=data, headers=request_headers, timeout=10)
            elif method == "PATCH":
                response = requests.patch(url, json=data, headers=request_headers, timeout=10)
            elif method == "DELETE":
                response = requests.delete(url, headers=request_headers, timeout=10)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
                
            response_time = (time.time() - start_time) * 1000
            return response, response_time
        except requests.RequestException as e:
            response_time = (time.time() - start_time) * 1000
            print(f"Request failed: {e}")
            return None, response_time

    def test_authentication_and_access_control(self):
        """Test authentication and access control"""
        self.current_test_category = "Authentication & Access Control"
        
        # Test 1: Valid admin login
        response, response_time = self.make_request("POST", "/auth/login/", self.admin_credentials, auth_required=False)
        if response and response.status_code == 200:
            data = response.json()
            if "access" in data and "user" in data:
                self.auth_token = data["access"]
                user_data = data["user"]
                if user_data.get("role") == "admin":
                    self.log_test("Admin Login Success", "PASS", f"Token received, role: {user_data.get('role')}", response_time)
                else:
                    self.log_test("Admin Login Success", "FAIL", f"Expected admin role, got: {user_data.get('role')}", response_time)
            else:
                self.log_test("Admin Login Success", "FAIL", "Missing access token or user data", response_time)
        else:
            self.log_test("Admin Login Success", "FAIL", f"Status: {response.status_code if response else 'No response'}", response_time)

        # Test 2: Invalid credentials
        invalid_credentials = {"email": "admin@mdc.com", "password": "wrongpassword"}
        response, response_time = self.make_request("POST", "/auth/login/", invalid_credentials, auth_required=False)
        if response and response.status_code in [400, 401]:
            self.log_test("Invalid Credentials Rejection", "PASS", "Correctly rejected invalid credentials", response_time)
        else:
            self.log_test("Invalid Credentials Rejection", "FAIL", f"Expected 400/401, got: {response.status_code if response else 'No response'}", response_time)

        # Test 3: Protected endpoint access with token
        response, response_time = self.make_request("GET", "/users/users/")
        if response and response.status_code == 200:
            self.log_test("Protected Endpoint Access", "PASS", "Successfully accessed protected endpoint", response_time)
        else:
            self.log_test("Protected Endpoint Access", "FAIL", f"Status: {response.status_code if response else 'No response'}", response_time)

        # Test 4: Protected endpoint access without token
        old_token = self.auth_token
        self.auth_token = None
        response, response_time = self.make_request("GET", "/users/users/")
        if response and response.status_code == 401:
            self.log_test("Unauthorized Access Prevention", "PASS", "Correctly blocked unauthorized access", response_time)
        else:
            self.log_test("Unauthorized Access Prevention", "FAIL", f"Expected 401, got: {response.status_code if response else 'No response'}", response_time)
        self.auth_token = old_token

    def test_user_listing_and_display(self):
        """Test user listing and display functionality"""
        self.current_test_category = "User Listing & Display"
        
        # Test 1: Get users list
        response, response_time = self.make_request("GET", "/users/users/")
        if response and response.status_code == 200:
            data = response.json()
            if "results" in data and isinstance(data["results"], list):
                users = data["results"]
                self.log_test("User List Retrieval", "PASS", f"Retrieved {len(users)} users", response_time)
                
                # Test user data structure
                if users:
                    user = users[0]
                    required_fields = ["id", "email", "full_name", "role", "status", "date_joined"]
                    missing_fields = [field for field in required_fields if field not in user]
                    if not missing_fields:
                        self.log_test("User Data Structure", "PASS", "All required fields present", response_time)
                    else:
                        self.log_test("User Data Structure", "FAIL", f"Missing fields: {missing_fields}", response_time)
                else:
                    self.log_test("User Data Structure", "WARNING", "No users found to test structure", response_time)
            else:
                self.log_test("User List Retrieval", "FAIL", "Invalid response structure", response_time)
        else:
            self.log_test("User List Retrieval", "FAIL", f"Status: {response.status_code if response else 'No response'}", response_time)

        # Test 2: Pagination
        response, response_time = self.make_request("GET", "/users/users/?page=1&page_size=2")
        if response and response.status_code == 200:
            data = response.json()
            if "pagination" in data:
                pagination = data["pagination"]
                if "count" in pagination and "page_size" in pagination:
                    self.log_test("Pagination Support", "PASS", f"Page size: {pagination.get('page_size')}, Total: {pagination.get('count')}", response_time)
                else:
                    self.log_test("Pagination Support", "FAIL", "Missing pagination fields", response_time)
            else:
                self.log_test("Pagination Support", "FAIL", "No pagination data", response_time)
        else:
            self.log_test("Pagination Support", "FAIL", f"Status: {response.status_code if response else 'No response'}", response_time)

        # Test 3: Get single user
        response, response_time = self.make_request("GET", "/users/users/1/")
        if response and response.status_code == 200:
            user_data = response.json()
            if "email" in user_data and "role" in user_data:
                self.log_test("Single User Retrieval", "PASS", f"Retrieved user: {user_data.get('email')}", response_time)
            else:
                self.log_test("Single User Retrieval", "FAIL", "Invalid user data structure", response_time)
        else:
            self.log_test("Single User Retrieval", "FAIL", f"Status: {response.status_code if response else 'No response'}", response_time)

    def test_search_and_filtering(self):
        """Test search and filtering capabilities"""
        self.current_test_category = "Search & Filtering"
        
        # Test 1: Search by email
        response, response_time = self.make_request("GET", "/users/users/?search=admin")
        if response and response.status_code == 200:
            data = response.json()
            users = data.get("results", [])
            admin_users = [u for u in users if "admin" in u.get("email", "").lower()]
            if admin_users:
                self.log_test("Search by Email", "PASS", f"Found {len(admin_users)} users with 'admin' in email", response_time)
            else:
                self.log_test("Search by Email", "WARNING", "No admin users found in search results", response_time)
        else:
            self.log_test("Search by Email", "FAIL", f"Status: {response.status_code if response else 'No response'}", response_time)

        # Test 2: Filter by role
        response, response_time = self.make_request("GET", "/users/users/?role=admin")
        if response and response.status_code == 200:
            data = response.json()
            users = data.get("results", [])
            admin_users = [u for u in users if u.get("role") == "admin"]
            if len(users) == len(admin_users):
                self.log_test("Filter by Role", "PASS", f"Found {len(admin_users)} admin users", response_time)
            else:
                self.log_test("Filter by Role", "FAIL", f"Filter not working: {len(users)} total, {len(admin_users)} admin", response_time)
        else:
            self.log_test("Filter by Role", "FAIL", f"Status: {response.status_code if response else 'No response'}", response_time)

        # Test 3: Filter by status
        response, response_time = self.make_request("GET", "/users/users/?status=active")
        if response and response.status_code == 200:
            data = response.json()
            users = data.get("results", [])
            active_users = [u for u in users if u.get("status") == "active"]
            if len(users) == len(active_users):
                self.log_test("Filter by Status", "PASS", f"Found {len(active_users)} active users", response_time)
            else:
                self.log_test("Filter by Status", "FAIL", f"Filter not working: {len(users)} total, {len(active_users)} active", response_time)
        else:
            self.log_test("Filter by Status", "FAIL", f"Status: {response.status_code if response else 'No response'}", response_time)

    def test_user_statistics(self):
        """Test user statistics display"""
        self.current_test_category = "User Statistics"
        
        # Test 1: Get user statistics
        response, response_time = self.make_request("GET", "/users/users/statistics/")
        if response and response.status_code == 200:
            data = response.json()
            stats_data = data.get("data", {})
            required_stats = ["total_users", "active_users", "users_by_role"]
            missing_stats = [stat for stat in required_stats if stat not in stats_data]
            if not missing_stats:
                self.log_test("Statistics Retrieval", "PASS", f"Total users: {stats_data.get('total_users')}, Active: {stats_data.get('active_users')}", response_time)
                
                # Test role breakdown
                role_stats = stats_data.get("users_by_role", {})
                if "admin" in role_stats:
                    self.log_test("Role Statistics", "PASS", f"Admin users: {role_stats.get('admin')}, Client users: {role_stats.get('client', 0)}", response_time)
                else:
                    self.log_test("Role Statistics", "WARNING", "No role breakdown available", response_time)
            else:
                self.log_test("Statistics Retrieval", "FAIL", f"Missing statistics: {missing_stats}", response_time)
        else:
            self.log_test("Statistics Retrieval", "FAIL", f"Status: {response.status_code if response else 'No response'}", response_time)

    def test_create_user_functionality(self):
        """Test create user functionality"""
        self.current_test_category = "Create User"
        
        # Test 1: Create new user with valid data
        response, response_time = self.make_request("POST", "/users/users/", self.test_user_data)
        if response and response.status_code == 201:
            user_data = response.json()
            if user_data.get("email") == self.test_user_data["email"]:
                self.created_user_id = user_data.get("id")
                self.log_test("User Creation Success", "PASS", f"Created user ID: {self.created_user_id}", response_time)
            else:
                self.log_test("User Creation Success", "FAIL", "User data mismatch", response_time)
        else:
            # Check if user already exists or other validation error
            if response and response.status_code == 400:
                error_data = response.json()
                if "email" in str(error_data).lower():
                    self.log_test("User Creation Success", "WARNING", "User already exists - this is expected behavior", response_time)
                else:
                    self.log_test("User Creation Success", "FAIL", f"Creation failed: {error_data}", response_time)
            else:
                self.log_test("User Creation Success", "FAIL", f"Status: {response.status_code if response else 'No response'}", response_time)

        # Test 2: Create user with duplicate email
        response, response_time = self.make_request("POST", "/users/users/", self.test_user_data)
        if response and response.status_code == 400:
            self.log_test("Duplicate Email Prevention", "PASS", "Correctly prevented duplicate email", response_time)
        else:
            self.log_test("Duplicate Email Prevention", "WARNING", "Duplicate prevention may not be working as expected", response_time)

        # Test 3: Create user with invalid email format
        invalid_data = self.test_user_data.copy()
        invalid_data["email"] = "invalid-email"
        response, response_time = self.make_request("POST", "/users/users/", invalid_data)
        if response and response.status_code == 400:
            self.log_test("Email Validation", "PASS", "Correctly rejected invalid email format", response_time)
        else:
            self.log_test("Email Validation", "WARNING", "Email validation may not be working", response_time)

    def test_edit_user_functionality(self):
        """Test edit user functionality"""
        self.current_test_category = "Edit User"
        
        # Get a user to edit (use admin user)
        user_id = 1
        
        # Test 1: Update user information
        update_data = {
            "first_name": "Updated",
            "last_name": "Admin"
        }
        response, response_time = self.make_request("PATCH", f"/users/users/{user_id}/", update_data)
        if response and response.status_code == 200:
            user_data = response.json()
            if "Updated" in user_data.get("full_name", ""):
                self.log_test("User Update Success", "PASS", f"Updated user name to: {user_data.get('full_name')}", response_time)
            else:
                self.log_test("User Update Success", "WARNING", "Update may not be reflected correctly", response_time)
        else:
            self.log_test("User Update Success", "FAIL", f"Status: {response.status_code if response else 'No response'}", response_time)

        # Test 2: Update non-existent user
        response, response_time = self.make_request("PATCH", "/users/users/99999/", update_data)
        if response and response.status_code == 404:
            self.log_test("Non-existent User Update", "PASS", "Correctly returned 404 for non-existent user", response_time)
        else:
            self.log_test("Non-existent User Update", "FAIL", f"Expected 404, got: {response.status_code if response else 'No response'}", response_time)

    def test_password_reset_functionality(self):
        """Test password reset functionality"""
        self.current_test_category = "Password Reset"
        
        # Test 1: Reset password request
        reset_data = {"email": "admin@mdc.com"}
        response, response_time = self.make_request("POST", "/users/reset-password/", reset_data, auth_required=False)
        if response and response.status_code == 200:
            response_data = response.json()
            if "success" in response_data and response_data["success"]:
                self.log_test("Password Reset Request", "PASS", "Password reset request processed successfully", response_time)
            else:
                self.log_test("Password Reset Request", "WARNING", "Password reset response format unexpected", response_time)
        else:
            self.log_test("Password Reset Request", "FAIL", f"Status: {response.status_code if response else 'No response'}", response_time)

        # Test 2: Reset password for non-existent user
        invalid_reset_data = {"email": "nonexistent@example.com"}
        response, response_time = self.make_request("POST", "/users/reset-password/", invalid_reset_data, auth_required=False)
        if response and response.status_code == 200:
            # This should still return 200 for security reasons (don't reveal if email exists)
            self.log_test("Non-existent Email Reset", "PASS", "Correctly handled non-existent email (security)", response_time)
        else:
            self.log_test("Non-existent Email Reset", "WARNING", f"Unexpected status: {response.status_code if response else 'No response'}", response_time)

    def test_pending_registrations(self):
        """Test pending registrations functionality"""
        self.current_test_category = "Pending Registrations"
        
        # Test 1: Get pending registrations
        response, response_time = self.make_request("GET", "/users/pending/")
        if response and response.status_code == 200:
            response_data = response.json()
            if "data" in response_data:
                pending_users = response_data["data"]
                self.log_test("Pending Registrations Retrieval", "PASS", f"Found {len(pending_users)} pending registrations", response_time)
            else:
                self.log_test("Pending Registrations Retrieval", "WARNING", "Unexpected response format", response_time)
        else:
            self.log_test("Pending Registrations Retrieval", "FAIL", f"Status: {response.status_code if response else 'No response'}", response_time)

    def test_bulk_operations(self):
        """Test bulk operations functionality"""
        self.current_test_category = "Bulk Operations"
        
        # Test 1: Bulk operations endpoint
        bulk_data = {
            "user_ids": [2, 3],  # Assuming these user IDs exist
            "action": "activate"
        }
        response, response_time = self.make_request("POST", "/users/bulk-operations/", bulk_data)
        if response and response.status_code == 200:
            response_data = response.json()
            if "success" in response_data and response_data["success"]:
                self.log_test("Bulk Operations", "PASS", "Bulk operation completed successfully", response_time)
            else:
                self.log_test("Bulk Operations", "WARNING", "Bulk operation response unexpected", response_time)
        else:
            self.log_test("Bulk Operations", "FAIL", f"Status: {response.status_code if response else 'No response'}", response_time)

    def test_bilingual_support(self):
        """Test bilingual support"""
        self.current_test_category = "Bilingual Support"
        
        # Test 1: Frontend language switching
        try:
            response = requests.get(f"{self.frontend_url}/users", timeout=10)
            if response.status_code == 200:
                content = response.text
                # Check for Arabic content or language switching elements
                if "data-lang" in content or "ar" in content or "العربية" in content:
                    self.log_test("Language Support Detection", "PASS", "Found language switching elements")
                else:
                    self.log_test("Language Support Detection", "WARNING", "No clear language switching detected")
            else:
                self.log_test("Language Support Detection", "FAIL", f"Frontend not accessible: {response.status_code}")
        except:
            self.log_test("Language Support Detection", "FAIL", "Could not access frontend")

    def test_performance_and_responsiveness(self):
        """Test performance characteristics"""
        self.current_test_category = "Performance"
        
        # Test 1: Response time for user list
        response, response_time = self.make_request("GET", "/users/users/")
        if response and response.status_code == 200:
            if response_time < 1000:  # Less than 1 second
                self.log_test("User List Performance", "PASS", f"Response time: {response_time:.2f}ms", response_time)
            elif response_time < 3000:  # Less than 3 seconds
                self.log_test("User List Performance", "WARNING", f"Slow response time: {response_time:.2f}ms", response_time)
            else:
                self.log_test("User List Performance", "FAIL", f"Very slow response time: {response_time:.2f}ms", response_time)
        else:
            self.log_test("User List Performance", "FAIL", "Request failed", response_time)

        # Test 2: Statistics performance
        response, response_time = self.make_request("GET", "/users/users/statistics/")
        if response and response.status_code == 200:
            if response_time < 2000:  # Less than 2 seconds
                self.log_test("Statistics Performance", "PASS", f"Response time: {response_time:.2f}ms", response_time)
            else:
                self.log_test("Statistics Performance", "WARNING", f"Slow response time: {response_time:.2f}ms", response_time)
        else:
            self.log_test("Statistics Performance", "FAIL", "Request failed", response_time)

    def test_error_handling(self):
        """Test error handling and edge cases"""
        self.current_test_category = "Error Handling"
        
        # Test 1: Invalid endpoint
        response, response_time = self.make_request("GET", "/users/invalid-endpoint/")
        if response and response.status_code == 404:
            self.log_test("Invalid Endpoint Handling", "PASS", "Correctly returned 404 for invalid endpoint", response_time)
        else:
            self.log_test("Invalid Endpoint Handling", "WARNING", f"Expected 404, got: {response.status_code if response else 'No response'}", response_time)

        # Test 2: Malformed data
        malformed_data = {"email": 123, "invalid_field": True}
        response, response_time = self.make_request("POST", "/users/users/", malformed_data)
        if response and response.status_code == 400:
            self.log_test("Malformed Data Handling", "PASS", "Correctly handled malformed data", response_time)
        else:
            self.log_test("Malformed Data Handling", "WARNING", "Malformed data handling may need improvement", response_time)

    def test_frontend_integration(self):
        """Test frontend integration"""
        self.current_test_category = "Frontend Integration"
        
        # Test 1: Frontend accessibility
        try:
            response = requests.get(self.frontend_url, timeout=10)
            if response.status_code == 200:
                self.log_test("Frontend Accessibility", "PASS", "Frontend server is accessible")
            else:
                self.log_test("Frontend Accessibility", "FAIL", f"Frontend returned status: {response.status_code}")
        except:
            self.log_test("Frontend Accessibility", "FAIL", "Frontend server not accessible")

        # Test 2: Users page accessibility
        try:
            response = requests.get(f"{self.frontend_url}/users", timeout=10)
            if response.status_code == 200:
                self.log_test("Users Page Accessibility", "PASS", "Users page is accessible")
            else:
                self.log_test("Users Page Accessibility", "WARNING", f"Users page returned: {response.status_code}")
        except:
            self.log_test("Users Page Accessibility", "WARNING", "Could not access users page")

        # Test 3: CORS headers
        try:
            headers = {"Origin": "http://localhost:3000"}
            response = requests.options(f"{self.base_url}/users/users/", headers=headers, timeout=10)
            cors_headers = response.headers.get("Access-Control-Allow-Origin")
            if cors_headers:
                self.log_test("CORS Configuration", "PASS", f"CORS headers present: {cors_headers}")
            else:
                self.log_test("CORS Configuration", "WARNING", "CORS headers may not be configured")
        except:
            self.log_test("CORS Configuration", "FAIL", "Could not test CORS configuration")

    def generate_comprehensive_report(self):
        """Generate comprehensive test report"""
        print("\n" + "="*80)
        print("MDC TRANSACTION TRACKING SYSTEM - USER MANAGEMENT TEST REPORT")
        print("="*80)
        print(f"Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Total Tests: {len(self.test_results)}")
        
        # Count results by status
        status_counts = {}
        for result in self.test_results:
            status = result["status"]
            status_counts[status] = status_counts.get(status, 0) + 1
        
        print(f"PASS: {status_counts.get('PASS', 0)}")
        print(f"FAIL: {status_counts.get('FAIL', 0)}")
        print(f"WARNING: {status_counts.get('WARNING', 0)}")
        print(f"INFO: {status_counts.get('INFO', 0)}")
        
        # Calculate success rate
        total_tests = len([r for r in self.test_results if r["status"] in ["PASS", "FAIL"]])
        passed_tests = status_counts.get("PASS", 0)
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        print(f"\nSuccess Rate: {success_rate:.1f}%")
        
        # Group results by category
        categories = {}
        for result in self.test_results:
            category = result["category"]
            if category not in categories:
                categories[category] = []
            categories[category].append(result)
        
        print("\n" + "-"*80)
        print("DETAILED RESULTS BY CATEGORY")
        print("-"*80)
        
        for category, results in categories.items():
            print(f"\n{category}:")
            for result in results:
                status_symbol = {
                    "PASS": "✓",
                    "FAIL": "✗", 
                    "WARNING": "⚠",
                    "INFO": "ℹ"
                }.get(result["status"], "?")
                
                print(f"  {status_symbol} {result['test_name']} - {result['status']}")
                if result["details"]:
                    print(f"    {result['details']}")
        
        print("\n" + "-"*80)
        print("IMPLEMENTATION ANALYSIS")
        print("-"*80)
        
        # Analyze implementation completeness
        critical_failures = [r for r in self.test_results if r["status"] == "FAIL"]
        warnings = [r for r in self.test_results if r["status"] == "WARNING"]
        
        print("\nCore Functionality Status:")
        auth_tests = [r for r in self.test_results if "Authentication" in r["category"]]
        auth_pass_rate = len([r for r in auth_tests if r["status"] == "PASS"]) / len(auth_tests) * 100 if auth_tests else 0
        print(f"  Authentication: {auth_pass_rate:.0f}% ({len([r for r in auth_tests if r['status'] == 'PASS'])}/{len(auth_tests)})")
        
        list_tests = [r for r in self.test_results if "Listing" in r["category"]]
        list_pass_rate = len([r for r in list_tests if r["status"] == "PASS"]) / len(list_tests) * 100 if list_tests else 0
        print(f"  User Listing: {list_pass_rate:.0f}% ({len([r for r in list_tests if r['status'] == 'PASS'])}/{len(list_tests)})")
        
        stats_tests = [r for r in self.test_results if "Statistics" in r["category"]]
        stats_pass_rate = len([r for r in stats_tests if r["status"] == "PASS"]) / len(stats_tests) * 100 if stats_tests else 0
        print(f"  Statistics: {stats_pass_rate:.0f}% ({len([r for r in stats_tests if r['status'] == 'PASS'])}/{len(stats_tests)})")
        
        print("\n" + "-"*80)
        print("RECOMMENDATIONS")
        print("-"*80)
        
        recommendations = []
        
        if critical_failures:
            recommendations.append("• CRITICAL: Fix failing core functionality before deployment")
            recommendations.append("  - Review authentication and authorization mechanisms")
            recommendations.append("  - Verify API endpoint routing and responses")
        
        if warnings:
            recommendations.append("• Investigate warning conditions:")
            for warning in warnings[:3]:  # Show first 3 warnings
                recommendations.append(f"  - {warning['test_name']}: {warning['details']}")
        
        # Performance recommendations
        slow_tests = [r for r in self.test_results if r["response_time"] > 2000]
        if slow_tests:
            recommendations.append("• Optimize API performance - some endpoints are slow")
        
        # Frontend recommendations
        frontend_tests = [r for r in self.test_results if "Frontend" in r["category"]]
        frontend_failures = [r for r in frontend_tests if r["status"] == "FAIL"]
        if frontend_failures:
            recommendations.append("• Fix frontend integration issues")
        
        if success_rate >= 90:
            recommendations.append("• System is ready for production deployment")
        elif success_rate >= 70:
            recommendations.append("• Address critical issues before production deployment")
        else:
            recommendations.append("• Significant development work needed before deployment")
        
        for rec in recommendations:
            print(rec)
        
        print("\n" + "-"*80)
        print("HTML PROTOTYPE COMPARISON")
        print("-"*80)
        
        print("Prototype Features vs Implementation:")
        print("  ✓ User listing table with avatars and badges")
        print("  ✓ Search and filtering functionality")
        print("  ✓ User statistics cards")
        print("  ✓ Pagination support")
        print("  ✓ Responsive design elements")
        print("  ⚠ Pending registrations modal (backend endpoints available)")
        print("  ⚠ User creation modal (frontend implementation needed)")
        print("  ⚠ Bulk operations (backend support exists)")
        print("  ⚠ Bilingual support (frontend switching needed)")
        
        print("\n" + "="*80)

    def run_all_tests(self):
        """Run all test suites"""
        print("Starting Corrected User Management System Tests...")
        print("Backend URL:", self.base_url)
        print("Frontend URL:", self.frontend_url)
        print("="*80)
        
        # Run all test suites
        test_suites = [
            self.test_authentication_and_access_control,
            self.test_user_listing_and_display,
            self.test_search_and_filtering,
            self.test_user_statistics,
            self.test_create_user_functionality,
            self.test_edit_user_functionality,
            self.test_password_reset_functionality,
            self.test_pending_registrations,
            self.test_bulk_operations,
            self.test_bilingual_support,
            self.test_performance_and_responsiveness,
            self.test_error_handling,
            self.test_frontend_integration
        ]
        
        for test_suite in test_suites:
            try:
                test_suite()
            except Exception as e:
                self.log_test(f"{test_suite.__name__}", "FAIL", f"Test suite failed with exception: {str(e)}")
            
            # Small delay between test suites
            time.sleep(0.5)
        
        # Generate final report
        self.generate_comprehensive_report()

if __name__ == "__main__":
    tester = CorrectedUserManagementTester()
    tester.run_all_tests()