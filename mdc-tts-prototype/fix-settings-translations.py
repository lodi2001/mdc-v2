#!/usr/bin/env python3
import re

# Read the settings.html file
with open('settings.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to find data-original-text with Arabic content
# This regex matches data-original-text="English Text">Arabic Text</
pattern = r'(data-original-text="([^"]+)")>([^<]+)<'

def replace_callback(match):
    full_match = match.group(0)
    attribute = match.group(1)  # data-original-text="English Text"
    english_text = match.group(2)  # English Text
    arabic_text = match.group(3)  # Arabic Text
    
    # Check if the content is Arabic (contains Arabic characters)
    if any('\u0600' <= c <= '\u06FF' for c in arabic_text):
        # Replace with English text as the content
        return f'{attribute}>{english_text}<'
    else:
        # Keep as is if it's already English
        return full_match

# Replace all occurrences
fixed_content = re.sub(pattern, replace_callback, content)

# Write back to file
with open('settings.html', 'w', encoding='utf-8') as f:
    f.write(fixed_content)

print("Fixed all translation issues in settings.html")
print("All elements with data-original-text now have English as initial content")