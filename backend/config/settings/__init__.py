"""
Settings module for the AI Chat project.

This module loads the appropriate settings based on the DJANGO_SETTINGS_MODULE environment variable.
"""
import os
from .base import *

# Determine the environment
ENVIRONMENT = os.getenv('DJANGO_ENV', 'development')

if ENVIRONMENT == 'production':
    from .production import *
elif ENVIRONMENT == 'development':
    from .development import *
else:
    from .development import *  # Default to development for safety

# Load any local settings (not version controlled)
try:
    from .local import *
except ImportError:
    pass
