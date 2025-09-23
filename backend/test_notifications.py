#!/usr/bin/env python3
"""
Comprehensive notification module testing script for MDC Transaction Tracking System
"""

import requests
import json
import time
from datetime import datetime
import sys
import os

# Add the backend directory to Python path
sys.path.append('/home/kms/dev/mdc-v2/backend')

class NotificationTester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.auth_token = None
        self.session = requests.Session()
        self.test_results = []

    def log_test(self, test_name, passed, details=""):
        """Log test result"""
        status = "PASS" if passed else "FAIL"
        result = {
            "test_name": test_name,
            "status": status,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        print(f"[{status}] {test_name}: {details}")

    def authenticate(self):
        """Authenticate with the backend"""
        login_data = {
            "email": "admin@mdc.com",
            "password": "admin123"
        }

        try:
            response = self.session.post(
                f"{self.base_url}/api/v1/auth/login/",
                json=login_data,
                headers={"Content-Type": "application/json"}
            )

            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get('access')
                self.session.headers.update({
                    'Authorization': f'Bearer {self.auth_token}'
                })
                self.log_test("Authentication", True, "Successfully logged in as admin")
                return True
            else:
                self.log_test("Authentication", False, f"Login failed: {response.status_code} - {response.text}")
                return False

        except Exception as e:
            self.log_test("Authentication", False, f"Login error: {str(e)}")
            return False

    def test_backend_endpoints(self):
        """Test backend notification API endpoints"""
        endpoints = [
            ("/api/v1/notifications/notifications/", "GET", "List notifications"),
            ("/api/v1/notifications/notifications/unread_count/", "GET", "Get unread count"),
        ]

        for endpoint, method, description in endpoints:
            try:
                if method == "GET":
                    response = self.session.get(f"{self.base_url}{endpoint}")
                else:
                    response = self.session.request(method, f"{self.base_url}{endpoint}")

                if response.status_code in [200, 201]:
                    self.log_test(f"Backend API - {description}", True,
                                f"Endpoint accessible (status: {response.status_code})")
                else:
                    self.log_test(f"Backend API - {description}", False,
                                f"Endpoint failed (status: {response.status_code})")

            except Exception as e:
                self.log_test(f"Backend API - {description}", False, f"Error: {str(e)}")

    def test_notification_count(self):
        """Test notification count endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/api/v1/notifications/notifications/unread_count/")
            if response.status_code == 200:
                data = response.json()
                count = data.get('count', 0)
                self.log_test("Notification Count", True, f"Unread count: {count}")
                return count
            else:
                self.log_test("Notification Count", False, f"Failed to get count: {response.status_code}")
                return 0
        except Exception as e:
            self.log_test("Notification Count", False, f"Error: {str(e)}")
            return 0

    def test_notification_list(self):
        """Test notification list endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/api/v1/notifications/notifications/")
            if response.status_code == 200:
                data = response.json()
                if 'results' in data:
                    notifications = data['results']
                    count = len(notifications)
                    unread = sum(1 for n in notifications if not n.get('is_read', True))
                    self.log_test("Notification List", True,
                                f"Found {count} notifications, {unread} unread")
                    return notifications
                else:
                    self.log_test("Notification List", False, "Unexpected response format")
                    return []
            else:
                self.log_test("Notification List", False, f"Failed to get list: {response.status_code}")
                return []
        except Exception as e:
            self.log_test("Notification List", False, f"Error: {str(e)}")
            return []

    def test_mark_as_read(self):
        """Test mark as read functionality"""
        try:
            # Get notifications first
            notifications = self.test_notification_list()
            unread_notifications = [n for n in notifications if not n.get('is_read', True)]

            if unread_notifications:
                # Mark first unread notification as read
                notification_id = unread_notifications[0]['id']
                response = self.session.post(
                    f"{self.base_url}/api/v1/notifications/notifications/mark_read/",
                    json={"notification_ids": [notification_id]}
                )

                if response.status_code in [200, 204]:
                    self.log_test("Mark As Read", True, f"Successfully marked notification {notification_id} as read")
                else:
                    self.log_test("Mark As Read", False, f"Failed to mark as read: {response.status_code}")
            else:
                self.log_test("Mark As Read", True, "No unread notifications to test with")

        except Exception as e:
            self.log_test("Mark As Read", False, f"Error: {str(e)}")

    def test_mark_all_as_read(self):
        """Test mark all as read functionality"""
        try:
            response = self.session.post(f"{self.base_url}/api/v1/notifications/notifications/mark_all_read/")
            if response.status_code in [200, 204]:
                self.log_test("Mark All As Read", True, "Successfully marked all notifications as read")

                # Verify count is now 0
                time.sleep(1)  # Brief delay
                count = self.test_notification_count()
                if count == 0:
                    self.log_test("Mark All As Read Verification", True, "Unread count is now 0")
                else:
                    self.log_test("Mark All As Read Verification", False, f"Unread count is still {count}")
            else:
                self.log_test("Mark All As Read", False, f"Failed: {response.status_code}")

        except Exception as e:
            self.log_test("Mark All As Read", False, f"Error: {str(e)}")

    def test_notification_grouping(self):
        """Test notification grouping by date"""
        try:
            notifications = self.test_notification_list()
            if notifications:
                # Group notifications by date (simplified client-side grouping test)
                from datetime import datetime, date

                today = date.today()
                groups = {"today": 0, "yesterday": 0, "this_week": 0, "older": 0}

                for notification in notifications:
                    created_date = datetime.fromisoformat(notification['created_at'].replace('Z', '+00:00')).date()
                    days_diff = (today - created_date).days

                    if days_diff == 0:
                        groups["today"] += 1
                    elif days_diff == 1:
                        groups["yesterday"] += 1
                    elif days_diff <= 7:
                        groups["this_week"] += 1
                    else:
                        groups["older"] += 1

                group_summary = ", ".join([f"{k}: {v}" for k, v in groups.items()])
                self.log_test("Notification Grouping", True, f"Groups: {group_summary}")
            else:
                self.log_test("Notification Grouping", False, "No notifications to group")

        except Exception as e:
            self.log_test("Notification Grouping", False, f"Error: {str(e)}")

    def test_notification_types(self):
        """Test notification type filtering"""
        types = ['transaction', 'system', 'user', 'report']

        for notification_type in types:
            try:
                response = self.session.get(
                    f"{self.base_url}/api/v1/notifications/notifications/?type={notification_type}"
                )
                if response.status_code == 200:
                    data = response.json()
                    notifications = data.get('results', [])
                    count = len(notifications)
                    self.log_test(f"Filter by Type - {notification_type}", True, f"Found {count} notifications")
                else:
                    self.log_test(f"Filter by Type - {notification_type}", False,
                                f"Failed: {response.status_code}")

            except Exception as e:
                self.log_test(f"Filter by Type - {notification_type}", False, f"Error: {str(e)}")

    def test_notification_read_filter(self):
        """Test read/unread filtering"""
        filters = [('true', 'read'), ('false', 'unread')]

        for filter_value, description in filters:
            try:
                response = self.session.get(
                    f"{self.base_url}/api/v1/notifications/notifications/?is_read={filter_value}"
                )
                if response.status_code == 200:
                    data = response.json()
                    notifications = data.get('results', [])
                    count = len(notifications)
                    self.log_test(f"Filter by Read Status - {description}", True, f"Found {count} notifications")
                else:
                    self.log_test(f"Filter by Read Status - {description}", False,
                                f"Failed: {response.status_code}")

            except Exception as e:
                self.log_test(f"Filter by Read Status - {description}", False, f"Error: {str(e)}")

    def test_clear_all(self):
        """Test clear all notifications functionality"""
        try:
            # First get current count
            initial_notifications = self.test_notification_list()
            initial_count = len(initial_notifications)

            response = self.session.delete(f"{self.base_url}/api/v1/notifications/notifications/clear_all/")
            if response.status_code in [200, 204]:
                self.log_test("Clear All Notifications", True,
                            f"Successfully cleared {initial_count} notifications")

                # Verify count is now 0
                time.sleep(1)  # Brief delay
                final_notifications = self.test_notification_list()
                final_count = len(final_notifications)

                if final_count == 0:
                    self.log_test("Clear All Verification", True, "All notifications cleared")
                else:
                    self.log_test("Clear All Verification", False, f"Still {final_count} notifications remaining")
            else:
                self.log_test("Clear All Notifications", False, f"Failed: {response.status_code}")

        except Exception as e:
            self.log_test("Clear All Notifications", False, f"Error: {str(e)}")

    def test_frontend_accessibility(self):
        """Test frontend accessibility"""
        try:
            response = requests.get("http://localhost:3000", timeout=5)
            if response.status_code == 200:
                self.log_test("Frontend Accessibility", True, "Frontend server is accessible")
            else:
                self.log_test("Frontend Accessibility", False, f"Frontend returned status {response.status_code}")
        except Exception as e:
            self.log_test("Frontend Accessibility", False, f"Frontend not accessible: {str(e)}")

    def create_test_data(self):
        """Create test notifications using Django management command"""
        try:
            import subprocess
            result = subprocess.run([
                'python', '/home/kms/dev/mdc-v2/backend/manage.py',
                'create_test_notifications', '--user', 'admin', '--count', '20'
            ], cwd='/home/kms/dev/mdc-v2/backend', capture_output=True, text=True)

            if result.returncode == 0:
                self.log_test("Test Data Creation", True, "Created 20 test notifications")
            else:
                self.log_test("Test Data Creation", False, f"Command failed: {result.stderr}")

        except Exception as e:
            self.log_test("Test Data Creation", False, f"Error: {str(e)}")

    def run_all_tests(self):
        """Run all notification tests"""
        print("=" * 80)
        print("MDC NOTIFICATION MODULE COMPREHENSIVE TEST REPORT")
        print("=" * 80)
        print(f"Test started at: {datetime.now().isoformat()}")
        print()

        # Test sequence
        if not self.authenticate():
            print("Authentication failed. Cannot proceed with tests.")
            return self.generate_report()

        # Create test data first
        self.create_test_data()

        # Backend API tests
        print("\n--- Backend API Tests ---")
        self.test_backend_endpoints()
        count = self.test_notification_count()
        notifications = self.test_notification_list()

        # Functional tests
        print("\n--- Functional Tests ---")
        self.test_notification_grouping()
        self.test_notification_types()
        self.test_notification_read_filter()

        # Action tests
        print("\n--- Action Tests ---")
        self.test_mark_as_read()

        # Frontend tests
        print("\n--- Frontend Tests ---")
        self.test_frontend_accessibility()

        # Destructive tests (run last)
        print("\n--- Destructive Tests ---")
        self.test_mark_all_as_read()
        # Note: Clear all test commented out to preserve data for manual testing
        # self.test_clear_all()

        return self.generate_report()

    def generate_report(self):
        """Generate final test report"""
        print("\n" + "=" * 80)
        print("TEST SUMMARY REPORT")
        print("=" * 80)

        total_tests = len(self.test_results)
        passed_tests = sum(1 for test in self.test_results if test['status'] == 'PASS')
        failed_tests = total_tests - passed_tests

        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Pass Rate: {(passed_tests/total_tests*100):.1f}%" if total_tests > 0 else "No tests run")

        if failed_tests > 0:
            print("\nFAILED TESTS:")
            for test in self.test_results:
                if test['status'] == 'FAIL':
                    print(f"  - {test['test_name']}: {test['details']}")

        print("\nDETAILED RESULTS:")
        for test in self.test_results:
            status_icon = "✓" if test['status'] == 'PASS' else "✗"
            print(f"  {status_icon} {test['test_name']}: {test['details']}")

        # Save report to file
        report_file = f"/home/kms/dev/mdc-v2/notification_test_report_{int(time.time())}.json"
        with open(report_file, 'w') as f:
            json.dump({
                'summary': {
                    'total_tests': total_tests,
                    'passed_tests': passed_tests,
                    'failed_tests': failed_tests,
                    'pass_rate': passed_tests/total_tests*100 if total_tests > 0 else 0
                },
                'test_results': self.test_results,
                'timestamp': datetime.now().isoformat()
            }, f, indent=2)

        print(f"\nDetailed report saved to: {report_file}")
        return self.test_results

if __name__ == "__main__":
    tester = NotificationTester()
    tester.run_all_tests()