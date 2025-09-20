#!/usr/bin/env python
"""
Test script for workflow APIs
"""

import requests
import json
import sys

BASE_URL = "http://localhost:8000"

# Test admin user credentials
ADMIN_USER = {
    "email": "admin@mdc.com",
    "password": "Admin@123456"
}

def get_token():
    """Get authentication token"""
    url = f"{BASE_URL}/api/v1/auth/login/"
    response = requests.post(url, json=ADMIN_USER)
    
    if response.status_code == 200:
        data = response.json()
        return data.get('access')
    else:
        print(f"Login failed: {response.status_code}")
        print(response.json())
        return None

def test_workflow_templates(token):
    """Test workflow template endpoints"""
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. List workflow templates
    print("\n1. LIST WORKFLOW TEMPLATES")
    url = f"{BASE_URL}/api/v1/workflows/templates/"
    response = requests.get(url, headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("Templates:", json.dumps(response.json(), indent=2))
    
    # 2. Create a workflow template
    print("\n2. CREATE WORKFLOW TEMPLATE")
    import time
    template_data = {
        "name": f"Translation Workflow {int(time.time())}",
        "description": "Standard workflow for translation projects",
        "category": "translation",
        "is_active": True,
        "allow_parallel_stages": False,
        "auto_assign": True,
        "notification_enabled": True
    }
    
    response = requests.post(url, json=template_data, headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        template = response.json()
        print("Created template:", json.dumps(template, indent=2))
        template_id = template['id']
        
        # 3. Add stages to the workflow
        print("\n3. CREATE WORKFLOW STAGES")
        stages = [
            {
                "workflow": template_id,
                "name": "Document Upload",
                "description": "Client uploads documents for translation",
                "order": 1,
                "stage_type": "start",
                "assigned_role": "client",
                "duration_days": 1,
                "requires_attachment": True
            },
            {
                "workflow": template_id,
                "name": "Translation",
                "description": "Translator works on the document",
                "order": 2,
                "stage_type": "task",
                "assigned_role": "editor",
                "duration_days": 3,
                "requires_comment": True
            },
            {
                "workflow": template_id,
                "name": "Review",
                "description": "Quality review of translation",
                "order": 3,
                "stage_type": "review",
                "assigned_role": "editor",
                "duration_days": 1
            },
            {
                "workflow": template_id,
                "name": "Client Approval",
                "description": "Client reviews and approves translation",
                "order": 4,
                "stage_type": "approval",
                "assigned_role": "client",
                "duration_days": 2
            },
            {
                "workflow": template_id,
                "name": "Completion",
                "description": "Translation complete",
                "order": 5,
                "stage_type": "end",
                "assigned_role": "admin",
                "auto_complete": True
            }
        ]
        
        stage_ids = {}
        stages_url = f"{BASE_URL}/api/v1/workflows/stages/"
        for stage in stages:
            response = requests.post(stages_url, json=stage, headers=headers)
            if response.status_code == 201:
                stage_data = response.json()
                stage_ids[stage['order']] = stage_data['id']
                print(f"Created stage: {stage['name']}")
            else:
                print(f"Failed to create stage {stage['name']}: {response.json()}")
        
        # 4. Create transitions between stages
        print("\n4. CREATE WORKFLOW TRANSITIONS")
        transitions = [
            {
                "workflow": template_id,
                "from_stage": stage_ids[1],
                "to_stage": stage_ids[2],
                "condition_type": "always"
            },
            {
                "workflow": template_id,
                "from_stage": stage_ids[2],
                "to_stage": stage_ids[3],
                "condition_type": "always"
            },
            {
                "workflow": template_id,
                "from_stage": stage_ids[3],
                "to_stage": stage_ids[4],
                "condition_type": "approval"
            },
            {
                "workflow": template_id,
                "from_stage": stage_ids[3],
                "to_stage": stage_ids[2],
                "condition_type": "rejection",
                "condition_data": {"reason": "needs_revision"}
            },
            {
                "workflow": template_id,
                "from_stage": stage_ids[4],
                "to_stage": stage_ids[5],
                "condition_type": "always"
            }
        ]
        
        transitions_url = f"{BASE_URL}/api/v1/workflows/transitions/"
        for transition in transitions:
            response = requests.post(transitions_url, json=transition, headers=headers)
            if response.status_code == 201:
                print(f"Created transition: Stage {transition['from_stage']} -> Stage {transition['to_stage']}")
            else:
                print(f"Failed to create transition: {response.json()}")
        
        # 5. Get workflow statistics
        print("\n5. GET WORKFLOW STATISTICS")
        stats_url = f"{BASE_URL}/api/v1/workflows/templates/{template_id}/statistics/"
        response = requests.get(stats_url, headers=headers)
        if response.status_code == 200:
            print("Statistics:", json.dumps(response.json(), indent=2))
        
        return template_id
    else:
        print("Failed to create template:", response.json())
        return None

def test_workflow_builder(token):
    """Test workflow builder endpoint"""
    print("\n6. TEST WORKFLOW BUILDER")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Validate workflow configuration
    validate_url = f"{BASE_URL}/api/v1/workflows/builder/validate/"
    workflow_config = {
        "template": {
            "name": "Review Workflow",
            "description": "Simple review workflow",
            "category": "review",
            "is_active": True
        },
        "stages": [
            {
                "name": "Submit",
                "order": 1,
                "stage_type": "start"
            },
            {
                "name": "Review",
                "order": 2,
                "stage_type": "review"
            },
            {
                "name": "Complete",
                "order": 3,
                "stage_type": "end"
            }
        ],
        "transitions": [
            {
                "from_stage_order": 1,
                "to_stage_order": 2
            },
            {
                "from_stage_order": 2,
                "to_stage_order": 3
            }
        ]
    }
    
    response = requests.post(validate_url, json=workflow_config, headers=headers)
    print(f"Validation status: {response.status_code}")
    print("Validation result:", json.dumps(response.json(), indent=2))

def main():
    """Main test function"""
    print("=" * 50)
    print("WORKFLOW API TESTS")
    print("=" * 50)
    
    # Get authentication token
    print("\nGetting authentication token...")
    token = get_token()
    
    if not token:
        print("Failed to authenticate. Exiting.")
        sys.exit(1)
    
    print("Successfully authenticated!")
    
    # Test workflow templates
    template_id = test_workflow_templates(token)
    
    # Test workflow builder
    test_workflow_builder(token)
    
    print("\n" + "=" * 50)
    print("WORKFLOW API TESTS COMPLETED")
    print("=" * 50)

if __name__ == "__main__":
    main()