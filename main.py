# -------------------------------------------------------------------------
# main.py - LanguagePal Application Entry Point
# -------------------------------------------------------------------------
# This is the entry point for the LanguagePal application.
# It imports the Flask app instance from app.py and runs it with proper
# configuration when executed directly.
# -------------------------------------------------------------------------

from app import app  # noqa: F401

# Run the Flask application when executed directly (not through gunicorn)
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
