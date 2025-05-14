# LanguagePal - AI-Powered Language Learning Chatbot

LanguagePal is an interactive language learning platform that uses Google's Gemini AI to help users practice conversations in foreign languages. Built with Python, Flask, and vanilla JavaScript, this application provides a personalized language learning experience with features designed to make practice effective and enjoyable.

## Features

- **Interactive Conversations**: Practice languages with an AI tutor that adapts to your level
- **Grammar Correction**: Receive instant corrections on your messages with proper grammar and word usage
- **Linguistic Analysis**: Get detailed breakdowns of sentences with word-by-word translations and explanations
- **Custom Vocabulary Lists**: Create and manage your own vocabulary lists to focus your practice
- **Click-to-Translate**: Click on any word in the conversation to see its translation and grammatical explanation
- **Multiple Languages**: Support for Spanish, French, German, Italian, Portuguese, Russian, Japanese, Chinese and Korean
- **Offline Capability**: Works offline with Progressive Web App (PWA) features

## Technology Stack

- **Backend**: Python, Flask
- **AI Integration**: Google Generative AI (Gemini), LangChain
- **Frontend**: HTML, CSS, JavaScript
- **Styling**: Bootstrap with Replit dark theme

## Application Structure

- **`app.py`**: Main Flask application with route definitions
- **`gemini_service.py`**: Integration with Google's Gemini AI for language processing
- **`vocabulary_service.py`**: Management of vocabulary lists and example words
- **`main.py`**: Application entry point
- **`templates/`**: HTML templates for the web interface
- **`static/`**: JavaScript, CSS, and static assets

## Key Features Explained

### Conversation with Grammar Correction

When you send a message, LanguagePal:
1. Analyzes your message for grammatical errors and word choice
2. Provides a corrected version to help you learn proper usage
3. Generates a contextually appropriate response in the target language

### Linguistic Analysis

The "Analyze" feature breaks down language elements:
- Full translation of the entire message
- Sentence-by-sentence translations
- Word-by-word analysis showing:
  - Grammatical role (noun, verb, adjective, etc.)
  - Direct translation
  - Explanations of conjugation, tense, and usage

### Vocabulary Lists

Create custom lists of words/phrases you want to practice:
- Define vocabulary lists for specific topics
- The AI will restrict responses to include those words
- Great for focused practice sessions

## Getting Started

### Prerequisites

- Python 3.11+ installed
- Google Gemini API key (Pro 1.0 or Flash 2.0)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/BroskiJ/LanguageLearningChatbot.git
   cd LanguageLearningChatbot
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Set environment variables:
   ```
   # Linux/MacOS
   export GEMINI_API_KEY='your_api_key'
   export SECRET_KEY='your_secret_key'

   # Windows
   set GEMINI_API_KEY=your_api_key
   set SECRET_KEY=your_secret_key
   ```

4. Run the application:
   ```
   python main.py
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

## Development Notes

- The application uses session storage instead of a database for simplicity
- The Google Gemini API key is stored as an environment variable for security
- LangChain is used as a backup method if direct API calls fail

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Generative AI for providing the language model
- LangChain for additional AI integration capabilities
- Replit for development environment and deployment tools