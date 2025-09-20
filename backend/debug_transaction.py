import requests
import json

# Login
login_response = requests.post('http://localhost:8000/api/v1/auth/login/', 
    json={'email': 'admin@mdc.com', 'password': 'admin123'})
token = login_response.json()['access']

# Get transaction detail
headers = {'Authorization': f'Bearer {token}'}
response = requests.get('http://localhost:8000/api/v1/transactions/7/', headers=headers)
print(f'Status: {response.status_code}')
if response.status_code != 200:
    # Find error details in HTML
    import re
    text = response.text
    # Look for exception value
    match = re.search(r'<h1>Exception Value:</h1>\s*<pre>(.*?)</pre>', text, re.DOTALL)
    if match:
        print(f"Error: {match.group(1).strip()}")
    else:
        # Look for AttributeError pattern
        match = re.search(r"AttributeError.*?'(.*?)'", text)
        if match:
            print(f"AttributeError: {match.group(0)}")
        else:
            print("Could not parse error from HTML")
else:
    print("Success!")
    print(json.dumps(response.json(), indent=2))