@echo off
set "FLASK_APP_DIR=C:\Users\Elijah\Projects\LanguageLearningChatbot"
set "FLASK_PORT=5000"

echo Starting Flask server...
start "" cmd /k "cd /d "%FLASK_APP_DIR%" && python app.py"

echo Waiting for Flask server to start (3 seconds)...
timeout /t 3 /nobreak >nul

echo Opening browser to http://localhost:%FLASK_PORT%/
start "" "http://localhost:%FLASK_PORT%/"

echo Flask server is running and browser should be open.