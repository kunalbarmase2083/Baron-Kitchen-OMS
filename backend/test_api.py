import urllib.request
import json
import traceback

try:
    # 1. Test GET /api/orders
    req = urllib.request.Request('http://localhost:8000/api/orders')
    with urllib.request.urlopen(req) as f:
        print("GET /api/orders:", f.status)
        print(f.read().decode('utf-8'))
    
    # 2. Test POST /api/orders/ai-capture
    data = json.dumps({'raw_text': '20 Thalis for Baron Kitchen - Kunal'}).encode('utf-8')
    req2 = urllib.request.Request('http://localhost:8000/api/orders/ai-capture', data=data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req2) as f:
        print("\nPOST /api/orders/ai-capture:", f.status)
        print(f.read().decode('utf-8'))

except Exception as e:
    print(f"ERROR: {e}")
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
    traceback.print_exc()
