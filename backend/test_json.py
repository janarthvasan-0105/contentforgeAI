import re
import json

def extract_json_from_text(text: str, is_array=False):
    text = text.strip()
    text = re.sub(r'```(?:json)?', '', text).strip()
    
    start_char = '[' if is_array else '{'
    end_char = ']' if is_array else '}'
    
    start_idx = text.find(start_char)
    end_idx = text.rfind(end_char)
    
    if start_idx != -1 and end_idx != -1 and end_idx >= start_idx:
        try:
            return json.loads(text[start_idx:end_idx+1])
        except Exception as e:
            print("Failed inner parse:", e)
            pass
    
    try:
        return json.loads(text)
    except Exception as e:
        print("Failed outer parse:", e)
        return [] if is_array else {}

test_str = """
Here is the JSON:
```json
{
    "hook": "This is a hook",
    "value": "This is a value",
    "cta": "This is a cta"
}
```
"""

print(extract_json_from_text(test_str, is_array=False))

test_str_2 = """
{
    "hook": "This is a hook",
    "value": "This is a value",
    "cta": "This is a cta",
}
"""
print(extract_json_from_text(test_str_2, is_array=False))
