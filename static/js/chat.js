document.addEventListener('DOMContentLoaded', function() {
    // Debug: Print page structure to the console
    console.log("DEBUGGING TEMPLATE:");
    console.log("URL Path:", window.location.pathname);
    console.log("HTML Title:", document.title);
    console.log("Logout link exists:", document.querySelector('a[href="/logout"]') !== null);
    console.log("User element:", document.querySelector('.user-dropdown') ? document.querySelector('.user-dropdown').textContent : 'Not found');
    console.log("Template elements:", document.querySelectorAll('.card-header h5').length);
    // Chat UI elements
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const chatMessages = document.getElementById('chat-messages');
    const languageSelect = document.getElementById('language-select');
    const vocabularySelect = document.getElementById('vocabulary-select');
    const newChatBtn = document.getElementById('new-chat-btn');
    const resetChatBtn = document.getElementById('reset-chat-btn');
    const languageBadge = document.getElementById('language-badge');
    const vocabBadge = document.getElementById('vocab-badge');
    
    // Analysis modal elements
    const analysisModal = new bootstrap.Modal(document.getElementById('analysisModal'));
    const analysisLoading = document.getElementById('analysis-loading');
    const analysisContent = document.getElementById('analysis-content');
    
    // Current chat state
    let currentLanguage = languageSelect ? languageSelect.value : 'Spanish';
    let currentVocabularyId = vocabularySelect ? vocabularySelect.value : '';
    let currentVocabularyName = '';
    let messages = [];
    
    // Set initial values for the dropdown badges
    if (languageBadge) {
        languageBadge.textContent = currentLanguage;
    }
    
    // Initialize chat
    initializeChat();

    // Event listeners
    if (messageForm) messageForm.addEventListener('submit', sendMessage);
    if (newChatBtn) newChatBtn.addEventListener('click', startNewChat);
    if (resetChatBtn) resetChatBtn.addEventListener('click', resetChat);
    
    // Add the main reset button from the chat interface
    const resetChatBtnMain = document.getElementById('reset-chat-btn-main');
    if (resetChatBtnMain) resetChatBtnMain.addEventListener('click', resetChat);
    
    // Handle language selection from both dropdown and select element
    if (languageSelect) languageSelect.addEventListener('change', updateLanguage);
    
    // Add event listeners for the language dropdown in the header
    document.querySelectorAll('.language-option').forEach(option => {
        option.addEventListener('click', function(e) {
            e.preventDefault();
            const selectedLanguage = this.getAttribute('data-language');
            
            // Update the select element if it exists
            if (languageSelect) {
                languageSelect.value = selectedLanguage;
            }
            
            // Then call the update function
            currentLanguage = selectedLanguage;
            updateLanguage();
        });
    });
    
    // Add event listeners for the vocabulary dropdown in the header
    document.querySelectorAll('.vocabulary-option').forEach(option => {
        option.addEventListener('click', function(e) {
            e.preventDefault();
            const selectedVocabId = this.getAttribute('data-vocabulary-id');
            
            // Update the select element if it exists
            if (vocabularySelect) {
                vocabularySelect.value = selectedVocabId;
            }
            
            // Also update our variables
            currentVocabularyId = selectedVocabId;
            currentVocabularyName = this.textContent.trim();
            
            // Then call the update function
            updateVocabulary();
        });
    });
    
    if (vocabularySelect) vocabularySelect.addEventListener('change', updateVocabulary);
    
    /**
     * Initialize the chat interface, loading saved settings and messages
     */
    function initializeChat() {
        // Get saved language preference
        const savedLanguage = getWithExpiry('selected_language') || localStorage.getItem('selected_language');
        if (savedLanguage && languageSelect) {
            languageSelect.value = savedLanguage;
            currentLanguage = savedLanguage;
            if (languageBadge) languageBadge.textContent = savedLanguage;
        }
        
        // Load vocabularies from API
        fetch('/api/vocabulary')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (!vocabularySelect) return;
                
                // Clear existing options except the first one
                while (vocabularySelect.options.length > 1) {
                    vocabularySelect.remove(1);
                }
                
                // Add vocabulary options
                if (data && data.length > 0) {
                    data.forEach(vocab => {
                        const option = document.createElement('option');
                        option.value = vocab.id;
                        option.textContent = vocab.name;
                        vocabularySelect.appendChild(option);
                    });
                }
                
                // Load saved vocabulary selection
                const lastUsedVocabId = getLastUsedVocabulary();
                
                if (lastUsedVocabId) {
                    // Try to select the saved vocabulary if it exists
                    const matchingOption = Array.from(vocabularySelect.options).find(option => option.value === lastUsedVocabId);
                    if (matchingOption) {
                        vocabularySelect.value = lastUsedVocabId;
                        currentVocabularyId = lastUsedVocabId;
                        currentVocabularyName = matchingOption.textContent;
                    }
                }
                
                // Update the vocabulary badge
                updateVocabulary();
                
                // Load messages from local storage for guest users or start a new chat
                if (!isLoggedIn()) {
                    const savedMessages = getChatMessages();
                    if (savedMessages && savedMessages.length > 0) {
                        messages = savedMessages;
                        renderMessages();
                    } else {
                        displayEmptyChat();
                    }
                } else if (messages.length === 0) {
                    displayEmptyChat();
                }
            })
            .catch(error => {
                console.error('Error loading vocabularies:', error);
                
                // Still continue with chat initialization even if vocabulary loading fails
                if (!isLoggedIn()) {
                    const savedMessages = getChatMessages();
                    if (savedMessages && savedMessages.length > 0) {
                        messages = savedMessages;
                        renderMessages();
                    } else {
                        displayEmptyChat();
                    }
                } else if (messages.length === 0) {
                    displayEmptyChat();
                }
            });
    }
    
    /**
     * Check if user is currently logged in
     * @returns {boolean} Always returns true since we removed authentication
     */
    function isLoggedIn() {
        return true; // Authentication removed, always return true
    }
    
    /**
     * Escape HTML special characters to prevent XSS
     * @param {string} unsafe - The unsafe string to escape
     * @returns {string} The escaped string
     */
    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    /**
     * Update the current language and save preference
     */
    function updateLanguage() {
        currentLanguage = languageSelect ? languageSelect.value : currentLanguage;
        
        // Update the badge in the language dropdown button
        if (languageBadge) {
            languageBadge.textContent = currentLanguage;
        }
        
        // Save language preference with expiry
        setWithExpiry('selected_language', currentLanguage, 30 * 24 * 60 * 60 * 1000);
    }
    
    /**
     * Update the current vocabulary selection and save preference
     */
    function updateVocabulary() {
        // Update from select if it exists and is being used
        if (vocabularySelect && event && event.target === vocabularySelect) {
            currentVocabularyId = vocabularySelect.value;
            currentVocabularyName = vocabularySelect.options[vocabularySelect.selectedIndex].text;
        }
        
        // Update the badge in the vocabulary dropdown button
        if (vocabBadge) {
            // Update badge text and color
            if (currentVocabularyId) {
                vocabBadge.textContent = currentVocabularyName;
                vocabBadge.closest('.badge').classList.remove('bg-secondary');
                vocabBadge.closest('.badge').classList.add('bg-success');
                
                // Save the vocabulary selection
                saveLastUsedVocabulary(currentVocabularyId);
            } else {
                vocabBadge.textContent = 'No vocabulary';
                vocabBadge.closest('.badge').classList.remove('bg-success');
                vocabBadge.closest('.badge').classList.add('bg-secondary');
                
                // Clear saved vocabulary selection
                saveLastUsedVocabulary('');
            }
        }
    }
    
    /**
     * Start a new chat with a welcome message
     */
    function startNewChat() {
        if (!chatMessages) return;
        
        // Clear messages
        messages = [];
        chatMessages.innerHTML = '';
        
        // Show loading indicator
        chatMessages.appendChild(createLoadingMessage());
        
        // Get a welcome message from the server
        fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                language: currentLanguage,
                vocabularyId: currentVocabularyId,
                isInitial: true
            })
        })
        .then(response => response.json())
        .then(data => {
            // Remove loading indicator
            const loadingElement = document.querySelector('.loading-message');
            if (loadingElement) loadingElement.remove();
            
            if (data.error) {
                displayEmptyChat();
            } else {
                // Add assistant welcome message
                messages.push({ role: 'assistant', content: data.response });
                renderMessages();
                
                // Save messages for guest users
                if (!isLoggedIn()) {
                    saveChatMessages(messages);
                }
            }
        })
        .catch(error => {
            console.error('Error getting welcome message:', error);
            
            // Remove loading indicator and display empty chat
            const loadingElement = document.querySelector('.loading-message');
            if (loadingElement) loadingElement.remove();
            
            displayEmptyChat();
        });
    }
    
    /**
     * Display an empty chat interface
     */
    function displayEmptyChat() {
        if (!chatMessages) return;
        
        chatMessages.innerHTML = `
            <div class="text-center p-5 text-muted">
                <i class="bi bi-chat-dots display-1 mb-3"></i>
                <h4>Chat Ready</h4>
                <p>Type a message below to begin chatting in ${currentLanguage}.</p>
                <button id="start-chat-btn" class="btn btn-primary mt-3">
                    <i class="bi bi-play-fill me-1"></i> Start Chat
                </button>
            </div>
        `;
        
        // Add event listener to the start chat button
        const startChatBtn = document.getElementById('start-chat-btn');
        if (startChatBtn) {
            startChatBtn.addEventListener('click', startNewChat);
        }
    }
    
    /**
     * Reset the current chat conversation
     */
    function resetChat() {
        if (!chatMessages) return;
        
        // Clear messages
        messages = [];
        
        // Show reset confirmation
        chatMessages.innerHTML = `
            <div class="text-center p-4 text-info">
                <i class="bi bi-arrow-counterclockwise display-4 mb-3"></i>
                <h5>Chat Reset</h5>
                <p>Your conversation has been cleared.</p>
                <p>Type a message to start a new chat.</p>
            </div>
        `;
        
        // Clear stored messages for guest users
        if (!isLoggedIn()) {
            localStorage.removeItem('chat_messages');
        }
        
        // Reset conversation memory on the server
        fetch('/api/chat/reset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }).catch(error => {
            console.error('Error resetting chat memory:', error);
        });
    }
    
    /**
     * Send a message to the chat
     * @param {Event} e - The form submit event
     */
    function sendMessage(e) {
        e.preventDefault();
        
        if (!messageInput || !chatMessages) return;
        
        const message = messageInput.value.trim();
        if (!message) return;
        
        // Clear input field
        messageInput.value = '';
        
        // Store message index for potential correction later
        const messageIndex = messages.length;
        
        // Add user message to the chat
        messages.push({ role: 'user', content: message });
        renderMessages();
        
        // Show loading indicator
        chatMessages.appendChild(createLoadingMessage());
        
        // Send to server
        fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                language: currentLanguage,
                vocabularyId: currentVocabularyId
            })
        })
        .then(response => response.json())
        .then(data => {
            // Remove loading indicator
            const loadingElement = document.querySelector('.loading-message');
            if (loadingElement) loadingElement.remove();
            
            if (data.error) {
                // Handle API key errors specially
                if (data.error.includes('API key') || data.error.includes('not configured')) {
                    messages.push({ 
                        role: 'error', 
                        content: 'API key required. Please set up your Gemini API key to use the chat feature.',
                        isApiKeyError: true
                    });
                } else {
                    messages.push({ role: 'error', content: data.error });
                }
            } else {
                // Handle message correction if provided
                if (data.originalMessage && data.correctedMessage && 
                    data.originalMessage !== data.correctedMessage) {
                    messages[messageIndex] = { 
                        role: 'user', 
                        content: data.originalMessage,
                        corrected: data.correctedMessage
                    };
                }
                
                // Add assistant response
                messages.push({ role: 'assistant', content: data.response });
            }
            
            // Update UI and save messages
            renderMessages();
            if (!isLoggedIn()) {
                saveChatMessages(messages);
            }
        })
        .catch(error => {
            console.error('Error sending message:', error);
            
            // Remove loading indicator
            const loadingElement = document.querySelector('.loading-message');
            if (loadingElement) loadingElement.remove();
            
            // Show error message
            messages.push({ 
                role: 'error', 
                content: 'Error connecting to server. Please try again.'
            });
            
            renderMessages();
        });
    }
    
    /**
     * Render all messages in the chat
     */
    function renderMessages() {
        if (!chatMessages) return;
        
        // Clear chat container
        chatMessages.innerHTML = '';
        
        if (messages.length === 0) {
            displayEmptyChat();
            return;
        }
        
        // Add message elements
        messages.forEach(message => {
            let messageElement;
            
            if (message.role === 'user') {
                messageElement = createUserMessage(message);
            } else if (message.role === 'assistant') {
                messageElement = createAssistantMessage(message.content);
            } else if (message.role === 'error') {
                messageElement = createErrorMessage(message.content);
                
                // No longer need API key setup link since we use environment variable
            }
            
            if (messageElement) {
                chatMessages.appendChild(messageElement);
                
                // Make sure we set up click listeners for each message
                console.log('Setting up click listeners for new message');
                setupTextSelectionListeners(messageElement);
            }
        });
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    /**
     * Create a user message bubble
     * @param {Object} message - The message object
     * @returns {HTMLElement} The message element
     */
    function createUserMessage(message) {
        const div = document.createElement('div');
        div.className = 'message-bubble user-message';
        
        // Check if the message has a correction
        if (message.corrected && message.corrected !== message.content) {
            // Original text
            const originalDiv = document.createElement('div');
            originalDiv.className = 'original-text mb-2';
            originalDiv.innerHTML = formatMessageText(message.content);
            div.appendChild(originalDiv);
            
            // Correction
            const correctionDiv = document.createElement('div');
            correctionDiv.className = 'correction border-top pt-2 mt-2';
            
            const correctionLabel = document.createElement('div');
            correctionLabel.className = 'correction-label text-warning small mb-1';
            correctionLabel.innerHTML = `<i class="bi bi-pencil-fill me-1"></i>Corrected:`;
            correctionDiv.appendChild(correctionLabel);
            
            const correctedContent = document.createElement('div');
            correctedContent.className = 'correction-content';
            correctedContent.innerHTML = formatMessageText(message.corrected);
            correctionDiv.appendChild(correctedContent);
            
            // Add analyze button for corrected message
            const actionBar = document.createElement('div');
            actionBar.className = 'action-bar text-end mt-2';
            
            const analyzeButton = document.createElement('button');
            analyzeButton.className = 'btn btn-sm btn-outline-light';
            analyzeButton.innerHTML = '<i class="bi bi-zoom-in me-1"></i>Analyze';
            analyzeButton.addEventListener('click', () => showAnalysis(message.corrected));
            
            actionBar.appendChild(analyzeButton);
            correctionDiv.appendChild(actionBar);
            
            div.appendChild(correctionDiv);
        } else {
            // Regular message without correction
            div.innerHTML = formatMessageText(message.content);
        }
        
        // Enable text selection for translation
        setupTextSelectionListeners(div);
        
        return div;
    }
    
    /**
     * Create an assistant message bubble
     * @param {string} content - The message content
     * @returns {HTMLElement} The message element
     */
    function createAssistantMessage(content) {
        const div = document.createElement('div');
        div.className = 'message-bubble assistant-message';
        
        // Add message content with markdown formatting
        div.innerHTML = formatMessageText(content);
        
        // Add analyze button
        const actionBar = document.createElement('div');
        actionBar.className = 'action-bar text-end mt-2';
        
        const analyzeButton = document.createElement('button');
        analyzeButton.className = 'btn btn-sm btn-outline-light';
        analyzeButton.innerHTML = '<i class="bi bi-zoom-in me-1"></i>Analyze';
        analyzeButton.addEventListener('click', () => showAnalysis(content));
        
        actionBar.appendChild(analyzeButton);
        div.appendChild(actionBar);
        
        // Enable text selection for translation
        setupTextSelectionListeners(div);
        
        return div;
    }
    
    /**
     * Add text selection listeners to enable translation on highlight
     * @param {HTMLElement} element - The element to monitor for text selection
     */
    function setupTextSelectionListeners(element) {
        if (!element) return;
        
        // Skip buttons and other interactive elements
        if (element.tagName === 'BUTTON' || 
            element.classList.contains('action-bar') || 
            element.classList.contains('btn')) {
            console.log('Skipping interactive element:', element);
            return;
        }
        
        // Create clickable spans for each word to enable precise translations
        const processNode = (node) => {
            // Skip if this is within a button or interactive element
            if (node.parentNode && 
                (node.parentNode.tagName === 'BUTTON' || 
                 node.parentNode.classList.contains('btn') ||
                 node.parentNode.classList.contains('action-bar'))) {
                return;
            }
            
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                // Split text into words and create spans
                const words = node.textContent.split(/\s+/);
                const fragment = document.createDocumentFragment();
                
                words.forEach((word, index) => {
                    if (word.trim()) {
                        const span = document.createElement('span');
                        span.className = 'translatable-word';
                        span.style.cursor = 'pointer';
                        span.textContent = word;
                        
                        // Add click handler to each word span
                        span.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const rect = span.getBoundingClientRect();
                            const x = rect.left + window.scrollX;
                            const y = rect.top + window.scrollY;
                            console.log('Translating word:', word);
                            showWordTranslation(word, currentLanguage, x, y);
                        });
                        
                        fragment.appendChild(span);
                        
                        // Add space between words
                        if (index < words.length - 1) {
                            fragment.appendChild(document.createTextNode(' '));
                        }
                    }
                });
                
                // Replace the original text node with our new word spans
                node.parentNode.replaceChild(fragment, node);
            } else if (node.nodeType === Node.ELEMENT_NODE && 
                      node.tagName !== 'BUTTON' && 
                      !node.classList.contains('btn') &&
                      !node.classList.contains('action-bar')) {
                // Process child nodes for non-button elements
                Array.from(node.childNodes).forEach(processNode);
            }
        };
        
        // Process content nodes but skip buttons and action bars
        Array.from(element.childNodes).forEach(node => {
            if (!(node.classList && (
                node.classList.contains('action-bar') || 
                node.classList.contains('btn') ||
                node.tagName === 'BUTTON'))) {
                processNode(node);
            }
        });
    }
    
    /**
     * Display a translation popup for the selected text
     * @param {string} word - The word or phrase to translate
     * @param {string} language - The source language
     * @param {number} x - X coordinate for popup
     * @param {number} y - Y coordinate for popup
     */
    function showWordTranslation(word, language, x, y) {
        // Create or get existing popup
        let popup = document.getElementById('translation-popup');
        if (!popup) {
            popup = document.createElement('div');
            popup.id = 'translation-popup';
            popup.className = 'translation-popup card bg-dark shadow p-2';
            popup.style.position = 'absolute';
            popup.style.zIndex = '1050';
            popup.style.maxWidth = '300px';
            popup.style.display = 'none';
            document.body.appendChild(popup);
            
            // Close popup when clicking elsewhere
            document.addEventListener('click', function(e) {
                if (popup && !popup.contains(e.target) && e.target.id !== 'translation-popup') {
                    popup.style.display = 'none';
                }
            });
        }
        
        // Position popup above the selection
        popup.style.left = `${x}px`;
        popup.style.top = `${y - 10}px`;
        
        // Show loading state
        popup.innerHTML = `
            <div class="text-center py-2">
                <div class="spinner-border spinner-border-sm text-light" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <span class="ms-2">Translating...</span>
            </div>
        `;
        popup.style.display = 'block';
        
        // Get translation from server
        fetch('/api/translate-word', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                word: word,
                language: language
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                popup.innerHTML = `
                    <div class="p-2">
                        <div class="alert alert-danger mb-0 p-2 small">
                            ${data.error}
                        </div>
                    </div>
                `;
            } else {
                popup.innerHTML = `
                    <div class="p-2">
                        <div class="mb-1 fw-bold">${escapeHtml(word)}</div>
                        <div class="mb-2 text-light">${formatMessageText(data.translation)}</div>
                        <button class="btn btn-sm btn-outline-light" onclick="document.getElementById('translation-popup').style.display='none'">
                            Close
                        </button>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error translating word:', error);
            popup.innerHTML = `
                <div class="p-2">
                    <div class="alert alert-danger mb-0 p-2 small">
                        Error translating word. Please try again.
                    </div>
                </div>
            `;
        });
    }
    
    /**
     * Create an error message element
     * @param {string} content - The error message
     * @returns {HTMLElement} The error message element
     */
    function createErrorMessage(content) {
        const div = document.createElement('div');
        div.className = 'alert alert-danger my-3';
        div.textContent = content;
        return div;
    }
    
    /**
     * Create a loading message element
     * @returns {HTMLElement} The loading message element
     */
    function createLoadingMessage() {
        const div = document.createElement('div');
        div.className = 'loading-message text-center my-3';
        div.innerHTML = `
            <div class="spinner-border text-light" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Generating response...</p>
        `;
        return div;
    }
    
    /**
     * Format message text with markdown and HTML sanitization
     * @param {string} text - The text to format
     * @returns {string} The formatted HTML
     */
    function formatMessageText(text) {
        if (typeof text !== 'string') return '';
        
        // Use marked.js to render markdown with line breaks
        return marked.parse(text, {
            breaks: true,
            gfm: true
        });
    }
    
    /**
     * Show language analysis for a message
     * @param {string} message - The message to analyze
     */
    function showAnalysis(message) {
        if (!analysisModal || !analysisContent || !analysisLoading) return;
        
        // Show modal with loading state
        analysisContent.classList.add('d-none');
        analysisLoading.classList.remove('d-none');
        analysisModal.show();
        
        // Request analysis from server
        fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                language: currentLanguage
            })
        })
        .then(response => response.json())
        .then(data => {
            // Hide loading indicator
            analysisLoading.classList.add('d-none');
            
            if (data.error) {
                analysisContent.innerHTML = `
                    <div class="alert alert-danger">
                        ${data.error}
                    </div>
                `;
            } else {
                // Allow the analysis to control the heading 
                analysisContent.innerHTML = formatMessageText(data.analysis);
                
                // Enable text selection in the analysis too
                setupTextSelectionListeners(analysisContent);
            }
            
            // Show content
            analysisContent.classList.remove('d-none');
        })
        .catch(error => {
            console.error('Error analyzing message:', error);
            
            // Show error
            analysisLoading.classList.add('d-none');
            analysisContent.innerHTML = `
                <div class="alert alert-danger">
                    Error analyzing message. Please try again.
                </div>
            `;
            analysisContent.classList.remove('d-none');
        });
    }
});