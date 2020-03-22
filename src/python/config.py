#!/usr/bin/env python
mongo = {
    "ip": '172.18.0.2',
    "port": 27017
}
index_path = '/usr/src/templates/index.html'
app = {
    'ip': "0.0.0.0",
    'port': 5000
}
secret_key = os.urandom(16)     # Create random key for user sessions