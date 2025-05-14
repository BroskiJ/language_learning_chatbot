# -------------------------------------------------------------------------
# app.py - LanguagePal Application
# -------------------------------------------------------------------------
# This Flask application provides a language learning platform powered by 
# Google's Gemini AI. It enables users to practice conversations with an
# AI language tutor, create and manage vocabulary lists, and receive
# instant grammar corrections and linguistic analysis.
#
# Key features:
# - Interactive AI-powered language conversations
# - Custom vocabulary list management
# - Real-time message correction and feedback
# - Linguistic analysis of messages
# - One-click word translations
# -------------------------------------------------------------------------

# Standard library imports
import os
import logging
import time
import uuid

# Flask and related imports
from flask import (
    Flask, 
    flash, 
    jsonify, 
    redirect, 
    render_template, 
    request, 
    send_from_directory, 
    session, 
    url_for
)
from werkzeug.middleware.proxy_fix import ProxyFix

# Application-specific imports
from gemini_service import (
    clear_conversation_memory,  # Reset conversation history
    correct_user_message,       # Correct grammar and word choice
    generate_analysis,          # Create linguistic analysis of messages
    generate_response,          # Generate AI conversation responses
    get_welcome_message,        # Get initial greeting in target language
    translate_single_word       # Translate individual words
)
from vocabulary_service import parse_vocabulary_text

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create the Flask application
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev_secret_key")
# ProxyFix middleware enables proper URL generation with https when behind a proxy
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Cache-busting mechanism: add timestamp to all templates 
# This ensures that browser always loads the latest CSS/JS when changes are made
@app.context_processor
def inject_now():
    """Add current timestamp to all templates for cache busting"""
    return {'now': int(time.time())}

# -------------------------------------------------------------------------
# Web Page Routes
# -------------------------------------------------------------------------

@app.route('/')
def index():
    """Render the landing/home page"""
    return render_template('index.html')

@app.route('/chat')
def chat():
    """
    Render the main chat interface
    
    This is the primary feature of the application where users can:
    1. Select a language to practice
    2. Choose a vocabulary list if desired
    3. Engage in conversation with the AI language tutor
    4. Receive corrections and linguistic analysis
    """
    # Create a session ID if not present to track conversation state
    if 'session_id' not in session:
        session['session_id'] = str(uuid.uuid4())
    
    # Get vocabulary lists from the session for the dropdown menu
    vocabulary_lists = session.get('vocabulary_lists', [])
    
    # Available languages for practice
    languages = ["Spanish", "French", "German", "Italian", "Portuguese", 
                 "Russian", "Japanese", "Chinese", "Korean"]
    
    # Add timestamp for cache busting to ensure latest JS/CSS loads
    timestamp = int(time.time())
    
    # Render the chat interface
    return render_template('chat.html', 
                          vocabulary_lists=vocabulary_lists, 
                          languages=languages, 
                          now=timestamp, 
                          version="v4")

@app.route('/vocabulary', methods=['GET', 'POST'])
def vocabulary():
    """
    Vocabulary list management page
    
    This page allows users to:
    1. Create new vocabulary lists by entering words/phrases
    2. View existing vocabulary lists
    3. Practice with specific vocabulary lists
    4. Edit or delete existing lists
    
    The vocabulary lists are stored in the session and can be used
    to restrict the AI responses to only use those words.
    """
    # Available languages for vocabulary lists
    languages = ["Spanish", "French", "German", "Italian", "Portuguese", 
                "Russian", "Japanese", "Chinese", "Korean"]
    
    # Handle form submission for creating a new vocabulary list
    if request.method == 'POST':
        # Get form data
        name = request.form.get('name', '')
        vocabulary_text = request.form.get('vocabulary', '')
        language = request.form.get('language', '')
        
        # Process vocabulary text into a list of words/phrases
        # This handles different formats (comma-separated, newlines, etc.)
        words = parse_vocabulary_text(vocabulary_text)
        
        # Validate input
        if not words:
            flash('Please provide valid vocabulary data')
            return redirect(url_for('vocabulary'))
        
        # Initialize vocabulary lists in session if not present
        if 'vocabulary_lists' not in session:
            session['vocabulary_lists'] = []
        
        # Create and store the new vocabulary list
        session['vocabulary_lists'].append({
            'id': int(time.time()),  # Use timestamp as unique ID
            'name': name,
            'language': language,
            'words': words
        })
        
        # Mark session as modified to ensure it's saved
        session.modified = True
        flash('Vocabulary list saved successfully!')
        
        # Redirect to chat page to practice with the new vocabulary
        timestamp = int(time.time())
        return redirect(url_for('chat', _t=timestamp))
    
    # Display the vocabulary management page (GET request)
    return render_template('vocabulary.html', languages=languages)

@app.route('/vocabulary/edit/<int:id>', methods=['GET', 'POST'])
def edit_vocabulary(id):
    """
    Edit an existing vocabulary list
    
    This route handles both:
    1. Displaying the edit form (GET request)
    2. Processing the form submission (POST request)
    
    The vocabulary list is updated in the session storage.
    """
    # Available languages for vocabulary lists
    languages = ["Spanish", "French", "German", "Italian", "Portuguese", 
                "Russian", "Japanese", "Chinese", "Korean"]
    
    # Find the requested vocabulary list by ID
    vocabulary = None
    if 'vocabulary_lists' in session:
        for vocab in session['vocabulary_lists']:
            if vocab['id'] == id:
                vocabulary = vocab
                break
    
    # Handle case where vocabulary list is not found
    if not vocabulary:
        flash('Vocabulary list not found', 'danger')
        return redirect(url_for('vocabulary'))
    
    # Process form submission (POST request)
    if request.method == 'POST':
        # Get updated data from form
        name = request.form.get('name', '')
        vocabulary_text = request.form.get('vocabulary', '')
        language = request.form.get('language', '')
        
        # Process vocabulary text into a list of words/phrases
        words = parse_vocabulary_text(vocabulary_text)
        
        # Validate input
        if not words:
            flash('Please provide valid vocabulary data', 'danger')
            return render_template('edit_vocabulary.html', vocabulary=vocabulary, languages=languages)
        
        # Update the vocabulary list in session
        for vocab in session['vocabulary_lists']:
            if vocab['id'] == id:
                vocab['name'] = name
                vocab['language'] = language
                vocab['words'] = words
                break
        
        # Mark session as modified to ensure changes are saved
        session.modified = True
        flash('Vocabulary list updated successfully!', 'success')
        return redirect(url_for('vocabulary'))
    
    # Prepare vocabulary words for display in text area (GET request)
    # Convert from list format to newline-separated string
    words_text = ''
    if isinstance(vocabulary['words'], list):
        words_text = '\n'.join(vocabulary['words'])
    else:
        words_text = vocabulary['words']
    
    # Display the edit form
    return render_template('edit_vocabulary.html', 
                          vocabulary=vocabulary, 
                          words_text=words_text, 
                          languages=languages)

# -------------------------------------------------------------------------
# API Routes
# -------------------------------------------------------------------------

@app.route('/api/vocabulary/delete/<int:id>', methods=['POST'])
def delete_vocabulary(id):
    """
    Delete a vocabulary list by ID
    
    This endpoint removes a vocabulary list from the session storage.
    It's called via AJAX from the vocabulary management page.
    """
    # Find and remove vocabulary list from session
    if 'vocabulary_lists' in session:
        for i, vocab in enumerate(session['vocabulary_lists']):
            if vocab['id'] == id:
                # Remove the item at the found index
                session['vocabulary_lists'].pop(i)
                # Mark session as modified to ensure changes are saved
                session.modified = True
                return jsonify({'success': True})
    
    # Return 404 if list not found
    return jsonify({'success': False, 'error': 'Vocabulary list not found'}), 404

@app.route('/api/chat', methods=['POST'])
def api_chat():
    """
    Primary chat API endpoint
    
    This endpoint handles:
    1. Sending welcome messages for new conversations
    2. Processing user messages 
    3. Correcting grammar and word choice
    4. Generating AI responses with optional vocabulary restrictions
    5. Maintaining conversation context between messages
    
    Request format:
    {
        "message": "User's message in target language",
        "language": "Target language (e.g., Spanish)",
        "vocabularyId": Optional ID of vocabulary list to restrict words,
        "isInitial": Boolean indicating if this is the first message
    }
    
    Response format:
    {
        "response": "AI response in target language",
        "originalMessage": "Original user message",
        "correctedMessage": "Grammar-corrected version"
    }
    """
    # Extract data from request
    data = request.json or {}
    message = data.get('message')
    language = data.get('language')
    vocabulary_id = data.get('vocabularyId')
    is_initial = data.get('isInitial', False)  # Flag for initial welcome message
    
    # Handle initial welcome message for new conversations
    if is_initial:
        welcome_message = get_welcome_message(language)
        return jsonify({'response': welcome_message})
    
    # Validate required parameters
    if not message or not language:
        return jsonify({'error': 'Missing required parameters'}), 400
    
    # Get vocabulary words if a vocabulary list was selected
    vocabulary = []
    if vocabulary_id:
        if 'vocabulary_lists' in session:
            for vocab in session['vocabulary_lists']:
                if vocab['id'] == int(vocabulary_id):
                    vocabulary = vocab['words']
                    break
    
    # Correct grammar and word choice in user's message
    original_message = message
    corrected_message = correct_user_message(message, language)
    
    # Generate AI response with optional vocabulary restrictions
    # Note: We use the corrected message for generation to ensure proper context
    response = generate_response(corrected_message, language, vocabulary)
    
    # Return all components for the frontend to display
    return jsonify({
        'response': response,
        'originalMessage': original_message,
        'correctedMessage': corrected_message
    })

@app.route('/api/chat/reset', methods=['POST'])
def api_chat_reset():
    """
    Reset the chat conversation memory for the current user
    
    This endpoint clears the conversation history and allows
    starting a fresh conversation with the AI language tutor.
    It's used when clicking the "New Chat" button.
    """
    # Use session ID for conversation ID
    conversation_id = session.get('session_id', 'guest')
    
    # Clear conversation memory in the Gemini service
    clear_conversation_memory(conversation_id)
    return jsonify({'success': True, 'message': 'Conversation memory cleared'})

@app.route('/api/analyze', methods=['POST'])
def api_analyze():
    """
    Generate linguistic analysis of a message
    
    This endpoint provides a detailed breakdown of the message
    including:
    1. Full translation of the entire message
    2. Sentence-by-sentence translation
    3. Word-by-word analysis with grammatical roles and explanations
    
    The analysis is displayed in a structured format with markdown.
    """
    # Extract data from request
    data = request.json or {}
    message = data.get('message')
    language = data.get('language')
    
    # Validate required parameters
    if not message or not language:
        return jsonify({'error': 'Missing required parameters'}), 400
    
    # Generate detailed linguistic analysis using Gemini
    analysis = generate_analysis(message, language)
    
    return jsonify({'analysis': analysis})
    
@app.route('/api/translate-word', methods=['POST'])
def translate_word():
    """
    API endpoint to translate a single word or short phrase
    
    This endpoint powers the click-to-translate feature that allows
    users to get quick translations of words while reading messages.
    
    It returns not just the translation but also a brief grammatical
    explanation of the word to help users understand its role and usage.
    """
    # Extract data from request
    data = request.json or {}
    word = data.get('word')
    language = data.get('language')
    
    # Validate required parameters
    if not word or not language:
        return jsonify({'error': 'Missing required parameters'}), 400
    
    # Get translation using Gemini, including grammatical explanation
    translation = translate_single_word(word, language)
    
    return jsonify({
        'word': word,
        'translation': translation,
        'language': language
    })

@app.route('/api/vocabulary', methods=['GET'])
def api_vocabulary():
    """
    API endpoint to retrieve all vocabulary lists
    
    This endpoint returns all vocabulary lists stored in the session.
    It's used by the frontend to populate the vocabulary selection dropdown
    and display the lists in the vocabulary management page.
    """
    # Return vocabulary lists from session
    if 'vocabulary_lists' in session:
        result = []
        for vocab in session['vocabulary_lists']:
            # Ensure words is an array (compatibility with older entries)
            words = vocab['words']
            if isinstance(words, str):
                words = words.split(', ')
            
            # Create a standardized response for each vocabulary list
            result.append({
                'id': vocab['id'],
                'name': vocab['name'],
                'language': vocab['language'],
                'words': words
            })
        return jsonify(result)
    else:
        # Return empty array if no vocabulary lists exist
        return jsonify([])

# -------------------------------------------------------------------------
# Progressive Web App (PWA) Support Routes
# -------------------------------------------------------------------------

@app.route('/service-worker.js')
def service_worker():
    """
    Serve service worker from the root path for proper scope
    
    This route is essential for PWA functionality, allowing the
    service worker to intercept requests and provide offline support.
    The service worker must be served from the root path to have
    the correct scope for the entire application.
    """
    return send_from_directory('static', 'service-worker.js')

@app.route('/offline')
def offline():
    """
    Offline fallback page
    
    This page is displayed when the user is offline and attempts
    to access a page that hasn't been cached by the service worker.
    It provides a friendly message and basic functionality that
    works without an internet connection.
    """
    return render_template('offline.html')

# Note: API key management now uses environment variables instead of session storage

# Start the Flask application when run directly
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
