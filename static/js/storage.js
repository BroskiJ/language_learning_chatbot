/**
 * Utility functions for working with browser storage
 */

/**
 * Save data to localStorage with expiration
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 * @param {number} ttl - Time to live in milliseconds
 */
function setWithExpiry(key, value, ttl) {
    const now = new Date();
    const item = {
        value: value,
        expiry: now.getTime() + ttl
    };
    localStorage.setItem(key, JSON.stringify(item));
}

/**
 * Get data from localStorage, returns null if expired
 * @param {string} key - Storage key
 * @returns {any} The stored value or null if expired/not found
 */
function getWithExpiry(key) {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) {
        return null;
    }
    
    const item = JSON.parse(itemStr);
    const now = new Date();
    
    if (now.getTime() > item.expiry) {
        localStorage.removeItem(key);
        return null;
    }
    
    return item.value;
}

/**
 * Save chat messages to localStorage
 * @param {Array} messages - Array of chat messages
 */
function saveChatMessages(messages) {
    // Save for 24 hours
    setWithExpiry('chat_messages', messages, 24 * 60 * 60 * 1000);
}

/**
 * Get chat messages from localStorage
 * @returns {Array} Array of chat messages or empty array if not found
 */
function getChatMessages() {
    return getWithExpiry('chat_messages') || [];
}

/**
 * Save vocabulary list to localStorage
 * @param {Array} lists - Array of vocabulary lists
 */
function saveVocabularyLists(lists) {
    // Save for 30 days
    setWithExpiry('vocabulary_lists', lists, 30 * 24 * 60 * 60 * 1000);
}

/**
 * Get vocabulary lists from localStorage
 * @returns {Array} Array of vocabulary lists or empty array if not found
 */
function getVocabularyLists() {
    return getWithExpiry('vocabulary_lists') || [];
}

/**
 * Save API key to localStorage
 * @param {string} apiKey - The API key to save
 * @param {number} ttl - Time to live in milliseconds (default: 30 days)
 */
function saveApiKey(apiKey, ttl = 30 * 24 * 60 * 60 * 1000) {
    setWithExpiry('gemini_api_key', apiKey, ttl);
}

/**
 * Get API key from localStorage
 * @returns {string|null} API key or null if not found/expired
 */
function getApiKey() {
    return getWithExpiry('gemini_api_key');
}

/**
 * Save the last used vocabulary list ID to localStorage
 * @param {string} vocabularyId - The ID of the last used vocabulary list
 */
function saveLastUsedVocabulary(vocabularyId) {
    // Save for 30 days
    setWithExpiry('last_used_vocabulary', vocabularyId, 30 * 24 * 60 * 60 * 1000);
}

/**
 * Get the last used vocabulary list ID from localStorage
 * @returns {string|null} The ID of the last used vocabulary list or null if not found/expired
 */
function getLastUsedVocabulary() {
    return getWithExpiry('last_used_vocabulary');
}

/**
 * Clear all app data from localStorage
 */
function clearAllData() {
    localStorage.removeItem('chat_messages');
    localStorage.removeItem('vocabulary_lists');
    localStorage.removeItem('gemini_api_key');
    localStorage.removeItem('last_used_vocabulary');
}
