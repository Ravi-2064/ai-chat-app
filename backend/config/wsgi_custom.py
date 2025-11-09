"""
Custom WSGI config for config project.
"""

import os
import sys

# Add the project directory to the Python path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Import Django's get_wsgi_application
from django.core.wsgi import get_wsgi_application

# Try to get the WSGI application
try:
    print("Attempting to get WSGI application...")
    application = get_wsgi_application()
    print("Successfully got WSGI application!")
except Exception as e:
    print(f"Error getting WSGI application: {e}")
    raise
