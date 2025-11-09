import os
import sys

# Add the project directory to the Python path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

try:
    from django.conf import settings
    print("Successfully imported Django settings!")
    print(f"INSTALLED_APPS: {settings.INSTALLED_APPS}")
    print(f"DATABASES: {settings.DATABASES}")
except Exception as e:
    print(f"Error importing Django settings: {e}")
    raise
