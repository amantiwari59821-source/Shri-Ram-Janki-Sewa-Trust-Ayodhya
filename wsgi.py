import os
from app import app
from database import init_db

try:
    init_db()
except Exception as e:
    print(f"Database init notice: {e}")

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
