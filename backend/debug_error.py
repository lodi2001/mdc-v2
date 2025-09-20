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
    # Save the full HTML response for inspection
    with open('error_response.html', 'w') as f:
        f.write(response.text)
    
    # Try to find any error information
    import re
    text = response.text
    
    # Look for Django exception text
    exception_match = re.search(r'<pre class="exception_value">(.*?)</pre>', text, re.DOTALL)
    if exception_match:
        print(f"Exception: {exception_match.group(1).strip()}")
    
    # Look for traceback
    traceback_match = re.search(r'<div id="traceback".*?<pre>(.*?)</pre>', text, re.DOTALL)
    if traceback_match:
        lines = traceback_match.group(1).strip().split('\n')
        print("\nLast few lines of traceback:")
        for line in lines[-10:]:
            print(line)
    
    print("\nFull error response saved to error_response.html")
else:
    print("Success!")
    print(json.dumps(response.json(), indent=2))