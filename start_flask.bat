@echo off
REM Set the Flask application directory to the current working directory
set "FLASK_APP_DIR=%cd%"
REM Set the Flask server port
set "FLASK_PORT=5000"

REM Activate the language_learning_chatbot environment using conda
call conda activate language_learning_chatbot

REM Start the Flask server in a new command window
echo Starting Flask server...
start "" cmd /k "cd /d "%FLASK_APP_DIR%" && python app.py"

REM Wait for the Flask server to start
echo Waiting for Flask server to start (3 seconds)...
timeout /t 3 /nobreak >nul

REM Open the default web browser to the Flask server URL
echo Opening browser to http://localhost:%FLASK_PORT%/
start "" "http://localhost:%FLASK_PORT%/"

REM Notify that the server and browser should be running
echo Flask server is running and browser should be open.