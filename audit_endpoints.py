import os, re

frontend_endpoints = set()
for root, dirs, files in os.walk('frontend/src'):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            with open(os.path.join(root, file), 'r', encoding='utf-8') as f:
                content = f.read()
                matches = re.findall(r'apiRequest\([\'\"\`]+([^\'\"\`\$\{]+)[\'\"\`]+', content)
                for m in matches:
                    frontend_endpoints.add(m)

backend_endpoints = set()
with open('lib/backend.sh', 'r', encoding='utf-8') as f:
    for line in f:
        m = re.search(r'@(?:router|admin_router|teacher_router|student_router|classes_router|ai_router)\.(?:get|post|put|delete)\([\'\"]([^\'\"]+)[\'\"]', line)
        if m:
            backend_endpoints.add(m.group(1))

print('Frontend called endpoints:')
for ep in sorted(frontend_endpoints): print(f'  {ep}')
print('\nBackend defined endpoints:')
for ep in sorted(backend_endpoints): print(f'  {ep}')
