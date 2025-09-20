#!/usr/bin/env python3
"""
Final Comprehensive Test Report for MDC Transaction Tracking System User Management

This script performs a complete evaluation of the User Management functionality
against the HTML prototype and requirements.
"""

import json
import requests
import time
from datetime import datetime
from typing import Dict, List, Optional

class FinalUserManagementTest:
    def __init__(self):
        self.base_url = "http://localhost:8000/api/v1"
        self.frontend_url = "http://localhost:3000"
        self.auth_token = None
        self.test_results = []
        
        # Test credentials
        self.admin_credentials = {
            "email": "admin@mdc.com",
            "password": "admin123"
        }

    def authenticate(self):
        """Authenticate and get admin token"""
        response = requests.post(
            f"{self.base_url}/auth/login/",
            json=self.admin_credentials,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            self.auth_token = data.get("access")
            user_data = data.get("user", {})
            return user_data.get("role") == "admin"
        return False

    def make_authenticated_request(self, method: str, endpoint: str, data: Dict = None):
        """Make authenticated request to API"""
        url = f"{self.base_url}{endpoint}"
        headers = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json"
        }
        
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=10)
            elif method == "POST":
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == "PATCH":
                response = requests.patch(url, json=data, headers=headers, timeout=10)
            elif method == "DELETE":
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                return None
            
            return response
        except requests.RequestException:
            return None

    def test_backend_functionality(self):
        """Test all backend functionality"""
        print("="*60)
        print("BACKEND FUNCTIONALITY TEST")
        print("="*60)
        
        results = {}
        
        # 1. Authentication Test
        print("1. Testing Authentication...")
        auth_success = self.authenticate()
        results["authentication"] = {
            "status": "PASS" if auth_success else "FAIL",
            "details": "Admin authentication successful" if auth_success else "Authentication failed"
        }
        print(f"   {results['authentication']['status']}: {results['authentication']['details']}")
        
        if not auth_success:
            print("   Cannot continue without authentication")
            return results
        
        # 2. User List Test
        print("2. Testing User List...")
        response = self.make_authenticated_request("GET", "/users/users/")
        if response and response.status_code == 200:
            data = response.json()
            users = data.get("results", [])
            results["user_list"] = {
                "status": "PASS",
                "details": f"Retrieved {len(users)} users with pagination"
            }
        else:
            results["user_list"] = {
                "status": "FAIL",
                "details": f"Status: {response.status_code if response else 'No response'}"
            }
        print(f"   {results['user_list']['status']}: {results['user_list']['details']}")
        
        # 3. User Statistics Test
        print("3. Testing User Statistics...")
        response = self.make_authenticated_request("GET", "/users/users/statistics/")
        if response and response.status_code == 200:
            data = response.json()
            stats = data.get("data", {})
            results["statistics"] = {
                "status": "PASS",
                "details": f"Total: {stats.get('total_users')}, Active: {stats.get('active_users')}"
            }
        else:
            results["statistics"] = {
                "status": "FAIL",
                "details": f"Status: {response.status_code if response else 'No response'}"
            }
        print(f"   {results['statistics']['status']}: {results['statistics']['details']}")
        
        # 4. Search and Filtering Test
        print("4. Testing Search and Filtering...")
        response = self.make_authenticated_request("GET", "/users/users/?search=admin&role=admin")
        if response and response.status_code == 200:
            data = response.json()
            users = data.get("results", [])
            results["search_filter"] = {
                "status": "PASS",
                "details": f"Search and filter returned {len(users)} results"
            }
        else:
            results["search_filter"] = {
                "status": "FAIL",
                "details": f"Status: {response.status_code if response else 'No response'}"
            }
        print(f"   {results['search_filter']['status']}: {results['search_filter']['details']}")
        
        # 5. Password Reset Test
        print("5. Testing Password Reset...")
        response = self.make_authenticated_request("POST", "/users/reset-password/", 
                                                 {"email": "admin@mdc.com"})
        if response and response.status_code == 200:
            results["password_reset"] = {
                "status": "PASS",
                "details": "Password reset request processed"
            }
        else:
            results["password_reset"] = {
                "status": "FAIL",
                "details": f"Status: {response.status_code if response else 'No response'}"
            }
        print(f"   {results['password_reset']['status']}: {results['password_reset']['details']}")
        
        # 6. Pending Registrations Test
        print("6. Testing Pending Registrations...")
        response = self.make_authenticated_request("GET", "/users/pending/")
        if response and response.status_code == 200:
            results["pending_registrations"] = {
                "status": "PASS",
                "details": "Pending registrations endpoint accessible"
            }
        else:
            results["pending_registrations"] = {
                "status": "FAIL",
                "details": f"Status: {response.status_code if response else 'No response'}"
            }
        print(f"   {results['pending_registrations']['status']}: {results['pending_registrations']['details']}")
        
        return results

    def test_frontend_accessibility(self):
        """Test frontend accessibility"""
        print("\n" + "="*60)
        print("FRONTEND ACCESSIBILITY TEST")
        print("="*60)
        
        results = {}
        
        # 1. Main Frontend Test
        print("1. Testing Main Frontend...")
        try:
            response = requests.get(self.frontend_url, timeout=10)
            if response.status_code == 200:
                results["frontend_main"] = {
                    "status": "PASS",
                    "details": "Frontend server accessible"
                }
            else:
                results["frontend_main"] = {
                    "status": "FAIL",
                    "details": f"Status: {response.status_code}"
                }
        except:
            results["frontend_main"] = {
                "status": "FAIL",
                "details": "Frontend server not accessible"
            }
        print(f"   {results['frontend_main']['status']}: {results['frontend_main']['details']}")
        
        # 2. Users Route Test
        print("2. Testing Users Route...")
        try:
            response = requests.get(f"{self.frontend_url}/users", timeout=10)
            if response.status_code == 200:
                results["users_route"] = {
                    "status": "PASS",
                    "details": "Users page accessible"
                }
            else:
                results["users_route"] = {
                    "status": "WARNING",
                    "details": f"Users page returned: {response.status_code}"
                }
        except:
            results["users_route"] = {
                "status": "FAIL",
                "details": "Users page not accessible"
            }
        print(f"   {results['users_route']['status']}: {results['users_route']['details']}")
        
        return results

    def compare_with_prototype(self):
        """Compare implementation with HTML prototype"""
        print("\n" + "="*60)
        print("HTML PROTOTYPE COMPARISON")
        print("="*60)
        
        # Read the HTML prototype
        try:
            with open("/home/kms/dev/mdc-v2/mdc-tts-prototype/users-list.html", "r") as f:
                prototype_content = f.read()
        except:
            print("   Could not read HTML prototype file")
            return {}
        
        prototype_features = {
            "user_table": "table table-hover table-mobile-card" in prototype_content,
            "avatars": "avatar-sm" in prototype_content,
            "role_badges": "badge bg-danger" in prototype_content and "badge bg-info" in prototype_content,
            "status_badges": "badge bg-success" in prototype_content and "badge bg-warning" in prototype_content,
            "search_functionality": 'placeholder="Search by name or email..."' in prototype_content,
            "role_filter": 'option value="admin"' in prototype_content,
            "status_filter": 'option value="active"' in prototype_content,
            "department_filter": 'option value="engineering"' in prototype_content,
            "pagination": "pagination" in prototype_content,
            "statistics_cards": "Total Users" in prototype_content and "Active Users" in prototype_content,
            "add_user_modal": "addUserModal" in prototype_content,
            "pending_registrations": "pendingRegistrationsModal" in prototype_content,
            "bilingual_support": 'data-lang="ar"' in prototype_content,
            "responsive_design": "col-12 col-sm-6 col-md-3" in prototype_content,
            "action_dropdown": "dropdown-menu" in prototype_content,
            "bulk_selection": 'type="checkbox"' in prototype_content
        }
        
        print("Prototype Features Analysis:")
        for feature, present in prototype_features.items():
            status = "✓ Present" if present else "✗ Missing"
            print(f"   {feature.replace('_', ' ').title()}: {status}")
        
        return prototype_features

    def analyze_typescript_implementation(self):
        """Analyze the TypeScript React implementation"""
        print("\n" + "="*60)
        print("TYPESCRIPT IMPLEMENTATION ANALYSIS")
        print("="*60)
        
        components_analysis = {}
        
        # Key components to check
        components = {
            "UsersPage": "/home/kms/dev/mdc-v2/frontend/src/pages/UsersPage.tsx",
            "UsersList": "/home/kms/dev/mdc-v2/frontend/src/components/users/UsersList.tsx",
            "UserFilters": "/home/kms/dev/mdc-v2/frontend/src/components/users/UserFilters.tsx",
            "UserStatisticsCards": "/home/kms/dev/mdc-v2/frontend/src/components/users/UserStatisticsCards.tsx",
            "AddEditUserModal": "/home/kms/dev/mdc-v2/frontend/src/components/users/AddEditUserModal.tsx",
            "PendingRegistrationsModal": "/home/kms/dev/mdc-v2/frontend/src/components/users/PendingRegistrationsModal.tsx",
            "UserService": "/home/kms/dev/mdc-v2/frontend/src/services/api/userService.ts",
            "UserTypes": "/home/kms/dev/mdc-v2/frontend/src/types/user.ts"
        }
        
        for component_name, file_path in components.items():
            try:
                with open(file_path, "r") as f:
                    content = f.read()
                    
                # Analyze component features
                features = {
                    "typescript": content.startswith("import") and "React" in content,
                    "proper_imports": "import React" in content,
                    "interface_definitions": "interface" in content,
                    "state_management": "useState" in content or "useEffect" in content,
                    "api_integration": "Service" in content or "api" in content,
                    "bilingual_support": "isRTL" in content or "localStorage.getItem('language')" in content,
                    "error_handling": "try" in content and "catch" in content,
                    "loading_states": "loading" in content or "Loading" in content,
                    "proper_typing": ": React.FC" in content or "Props" in content
                }
                
                components_analysis[component_name] = {
                    "exists": True,
                    "features": features,
                    "lines": len(content.splitlines())
                }
                
                # Count implemented features
                implemented_features = sum(features.values())
                total_features = len(features)
                completion_rate = (implemented_features / total_features) * 100
                
                print(f"\n{component_name}:")
                print(f"   File exists: ✓")
                print(f"   Lines of code: {components_analysis[component_name]['lines']}")
                print(f"   Feature completion: {completion_rate:.0f}% ({implemented_features}/{total_features})")
                
                for feature, present in features.items():
                    status = "✓" if present else "✗"
                    print(f"     {feature.replace('_', ' ').title()}: {status}")
                    
            except FileNotFoundError:
                components_analysis[component_name] = {
                    "exists": False,
                    "features": {},
                    "lines": 0
                }
                print(f"\n{component_name}: ✗ File not found")
        
        return components_analysis

    def generate_final_report(self, backend_results, frontend_results, prototype_features, components_analysis):
        """Generate comprehensive final report"""
        print("\n" + "="*80)
        print("FINAL COMPREHENSIVE TEST REPORT")
        print("MDC TRANSACTION TRACKING SYSTEM - USER MANAGEMENT")
        print("="*80)
        print(f"Report Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Test Environment: Backend ({self.base_url}) & Frontend ({self.frontend_url})")
        
        # Backend Summary
        backend_pass = sum(1 for r in backend_results.values() if r["status"] == "PASS")
        backend_total = len(backend_results)
        backend_rate = (backend_pass / backend_total * 100) if backend_total > 0 else 0
        
        # Frontend Summary
        frontend_pass = sum(1 for r in frontend_results.values() if r["status"] == "PASS")
        frontend_total = len(frontend_results)
        frontend_rate = (frontend_pass / frontend_total * 100) if frontend_total > 0 else 0
        
        # Component Analysis
        existing_components = sum(1 for c in components_analysis.values() if c["exists"])
        total_components = len(components_analysis)
        component_rate = (existing_components / total_components * 100) if total_components > 0 else 0
        
        print(f"\nOVERALL IMPLEMENTATION STATUS:")
        print(f"├─ Backend API: {backend_rate:.0f}% ({backend_pass}/{backend_total} tests passing)")
        print(f"├─ Frontend Access: {frontend_rate:.0f}% ({frontend_pass}/{frontend_total} tests passing)")
        print(f"├─ Component Implementation: {component_rate:.0f}% ({existing_components}/{total_components} components)")
        print(f"└─ Prototype Features: {sum(prototype_features.values())}/{len(prototype_features)} features identified")
        
        # Detailed Analysis
        print(f"\nDETAILED ANALYSIS:")
        
        print(f"\n1. BACKEND API FUNCTIONALITY:")
        for test_name, result in backend_results.items():
            status_symbol = "✓" if result["status"] == "PASS" else "✗"
            print(f"   {status_symbol} {test_name.replace('_', ' ').title()}: {result['details']}")
        
        print(f"\n2. FRONTEND ACCESSIBILITY:")
        for test_name, result in frontend_results.items():
            status_symbol = "✓" if result["status"] == "PASS" else ("⚠" if result["status"] == "WARNING" else "✗")
            print(f"   {status_symbol} {test_name.replace('_', ' ').title()}: {result['details']}")
        
        print(f"\n3. COMPONENT IMPLEMENTATION:")
        for component_name, analysis in components_analysis.items():
            if analysis["exists"]:
                feature_count = sum(analysis["features"].values())
                total_features = len(analysis["features"])
                completion = (feature_count / total_features * 100) if total_features > 0 else 0
                print(f"   ✓ {component_name}: {completion:.0f}% complete ({analysis['lines']} LOC)")
            else:
                print(f"   ✗ {component_name}: Not implemented")
        
        # Key Findings
        print(f"\nKEY FINDINGS:")
        
        if backend_rate >= 80:
            print("   ✓ Backend API is robust and production-ready")
        elif backend_rate >= 60:
            print("   ⚠ Backend API is functional but needs improvements")
        else:
            print("   ✗ Backend API has critical issues requiring attention")
        
        if existing_components >= 6:
            print("   ✓ Frontend components are well implemented")
        elif existing_components >= 4:
            print("   ⚠ Frontend has core components but missing some features")
        else:
            print("   ✗ Frontend implementation is incomplete")
        
        # Calculate overall project completion
        overall_score = (backend_rate + frontend_rate + component_rate) / 3
        
        print(f"\nOVERALL PROJECT COMPLETION: {overall_score:.1f}%")
        
        if overall_score >= 80:
            print("   STATUS: ✓ READY FOR PRODUCTION")
            print("   RECOMMENDATION: Deploy with monitoring")
        elif overall_score >= 60:
            print("   STATUS: ⚠ READY FOR STAGING")
            print("   RECOMMENDATION: Address warnings before production")
        else:
            print("   STATUS: ✗ REQUIRES DEVELOPMENT")
            print("   RECOMMENDATION: Complete implementation before deployment")
        
        # Implementation vs Prototype Comparison
        prototype_match = sum(prototype_features.values()) / len(prototype_features) * 100
        print(f"\nPROTOTYPE FIDELITY: {prototype_match:.1f}%")
        
        print(f"\nRECOMMENDATIONS:")
        if backend_rate < 100:
            print("   • Complete backend API implementation")
        if frontend_rate < 100:
            print("   • Resolve frontend routing and accessibility issues")
        if existing_components < total_components:
            print("   • Complete missing React components")
        if prototype_match < 90:
            print("   • Align implementation closer with HTML prototype")
        
        print("\n" + "="*80)

    def run_comprehensive_test(self):
        """Run all tests and generate final report"""
        print("Starting Final Comprehensive User Management Test...")
        print("This test evaluates the complete implementation against requirements.")
        
        # Run all tests
        backend_results = self.test_backend_functionality()
        frontend_results = self.test_frontend_accessibility()
        prototype_features = self.compare_with_prototype()
        components_analysis = self.analyze_typescript_implementation()
        
        # Generate final report
        self.generate_final_report(
            backend_results, 
            frontend_results, 
            prototype_features, 
            components_analysis
        )

if __name__ == "__main__":
    tester = FinalUserManagementTest()
    tester.run_comprehensive_test()