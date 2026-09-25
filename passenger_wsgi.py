import sys
import os

# Set current directory in path
sys.path.insert(0, os.path.dirname(__file__))

# Import the Flask application as 'application' (Required by Hostinger / Phusion Passenger)
from app import app as application
