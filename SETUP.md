# LanguagePal Setup Guide

This guide will walk you through setting up LanguagePal on your local machine.

## Prerequisites

1. Python 3.11 or higher
2. A Google Gemini API key (Pro 1.0 or Flash 2.0)
3. Git (optional, for cloning the repository)

## Installation Steps

### 1. Clone or Download the Repository

```bash
git clone https://github.com/BroskiJ/LanguageLearningChatbot.git
cd LanguageLearningChatbot
```

Alternatively, you can download the code as a ZIP file from GitHub and extract it.

### 2. Create a Virtual Environment (Recommended)

```bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 3. Install Required Packages

```bash
# Install from the packages.txt file
pip install -r packages.txt
```

### 4. Set Environment Variables

You'll need to set your Google Gemini API key as an environment variable:

#### On Windows:
```
set GEMINI_API_KEY=your_api_key_here
set SECRET_KEY=your_secret_key_here
```

#### On macOS/Linux:
```
export GEMINI_API_KEY=your_api_key_here
export SECRET_KEY=your_secret_key_here
```

#### For persistent settings:
Add these to your environment variables configuration or your shell's profile file.

### 5. Run the Application

```bash
python main.py
```

The application will be available at http://localhost:5000

## Configuration Options

### Database Configuration

By default, LanguagePal uses session storage for simplicity. If you want to use a database:

1. Set the `DATABASE_URL` environment variable to your database connection string
2. Uncomment and modify the database configuration in `app.py` as needed

### Custom Port

To run on a different port:

```bash
python main.py --port 8080
```

Or modify the port in the `main.py` file.

## Troubleshooting

### API Key Issues

If you see errors related to the Gemini API key:
- Verify that your API key is correct
- Check that the environment variable is set correctly
- Ensure your API key has the necessary permissions

### Package Installation Problems

If you encounter package installation issues:
- Make sure you're using Python 3.11+
- Try installing packages one by one
- Check for any system-specific requirements for packages like psycopg2-binary

## Deployment

For deployment to production, we recommend:
- Using gunicorn as a WSGI server
- Setting up HTTPS with a reverse proxy like Nginx
- Using environment variables for all sensitive information
- Setting DEBUG=False in production

### Example gunicorn command:

```bash
gunicorn --bind 0.0.0.0:5000 main:app
```