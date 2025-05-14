document.addEventListener('DOMContentLoaded', function() {
    // Get the elements
    const vocabularyListsContainer = document.getElementById('vocabulary-lists');
    const noVocabMessage = document.getElementById('no-vocab-message');
    
    // Optional elements - may not exist on all pages
    const manualTab = document.getElementById('manual-tab');
    const duolingoTab = document.getElementById('duolingo-tab');
    const vocabularyInput = document.querySelector('textarea[name="vocabulary"]');
    const duolingoUsernameInput = document.querySelector('input[name="duolingo_username"]');

    // Add event listeners for the tabs if they exist
    if (manualTab && duolingoUsernameInput) {
        manualTab.addEventListener('click', function() {
            duolingoUsernameInput.value = '';
        });
    }

    if (duolingoTab && vocabularyInput) {
        duolingoTab.addEventListener('click', function() {
            vocabularyInput.value = '';
        });
    }

    // Load vocabulary lists
    loadVocabularyLists();

    function loadVocabularyLists() {
        fetch('/api/vocabulary')
            .then(response => response.json())
            .then(data => {
                if (data.length === 0) {
                    noVocabMessage.classList.remove('d-none');
                    vocabularyListsContainer.innerHTML = '';
                    return;
                }

                // Hide the "no vocabulary" message
                noVocabMessage.classList.add('d-none');
                
                // Sort vocabulary lists alphabetically by name
                data.sort((a, b) => {
                    const nameA = a.name.toLowerCase();
                    const nameB = b.name.toLowerCase();
                    return nameA.localeCompare(nameB);
                });

                // Generate HTML for vocabulary lists
                let html = '';
                data.forEach(vocabulary => {
                    const wordCount = Array.isArray(vocabulary.words) 
                        ? vocabulary.words.length 
                        : vocabulary.words.split(',').length;

                    // Determine if this is an authenticated user (edit/delete only available for logged-in users)
                    const isAuthenticated = true; // Authentication removed, always return true
                    
                    // Create action buttons based on authentication status
                    let actionButtons = `
                        <a href="/chat" class="btn btn-sm btn-outline-primary w-100 mb-2 practice-btn" data-vocab-id="${vocabulary.id}">
                            <i class="bi bi-chat-dots me-1"></i>Practice with this vocabulary
                        </a>
                    `;
                    
                    if (isAuthenticated) {
                        actionButtons += `
                            <div class="d-flex">
                                <a href="/vocabulary/edit/${vocabulary.id}" class="btn btn-sm btn-outline-secondary flex-grow-1 me-1">
                                    <i class="bi bi-pencil me-1"></i>Edit
                                </a>
                                <button class="btn btn-sm btn-outline-danger flex-grow-1 delete-vocab-btn" 
                                    data-vocab-id="${vocabulary.id}" data-vocab-name="${escapeHtml(vocabulary.name)}">
                                    <i class="bi bi-trash me-1"></i>Delete
                                </button>
                            </div>
                        `;
                    } else {
                        // For guest users, add a delete button that uses the JS API
                        actionButtons += `
                            <button class="btn btn-sm btn-outline-danger w-100 delete-vocab-btn" 
                                data-vocab-id="${vocabulary.id}" data-vocab-name="${escapeHtml(vocabulary.name)}">
                                <i class="bi bi-trash me-1"></i>Delete List
                            </button>
                        `;
                    }

                    html += `
                        <div class="col-md-6 col-lg-4 vocab-card" data-vocab-id="${vocabulary.id}">
                            <div class="card h-100 bg-dark border-secondary">
                                <div class="card-header d-flex justify-content-between align-items-center">
                                    <h5 class="mb-0">${escapeHtml(vocabulary.name)}</h5>
                                    <span class="badge bg-info">${escapeHtml(vocabulary.language)}</span>
                                </div>
                                <div class="card-body">
                                    <p class="mb-0"><strong>${wordCount}</strong> words/phrases</p>
                                    <div class="mt-3 mb-2">
                                        <small class="text-muted">Sample words:</small>
                                    </div>
                                    <div class="vocabulary-sample">
                                        ${generateSampleWords(vocabulary.words)}
                                    </div>
                                </div>
                                <div class="card-footer">
                                    ${actionButtons}
                                </div>
                            </div>
                        </div>
                    `;
                });

                vocabularyListsContainer.innerHTML = html;
                
                // Add event listeners to delete buttons
                document.querySelectorAll('.delete-vocab-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const vocabId = this.dataset.vocabId;
                        const vocabName = this.dataset.vocabName;
                        
                        if (confirm(`Are you sure you want to delete the vocabulary list "${vocabName}"? This cannot be undone.`)) {
                            deleteVocabulary(vocabId);
                        }
                    });
                });
                
                // Add event listeners to practice buttons
                document.querySelectorAll('.practice-btn').forEach(btn => {
                    btn.addEventListener('click', function(e) {
                        const vocabId = this.dataset.vocabId;
                        // Save this vocabulary ID as the last used vocabulary
                        if (typeof saveLastUsedVocabulary === 'function') {
                            saveLastUsedVocabulary(vocabId);
                        }
                    });
                });
            })
            .catch(error => {
                console.error('Error loading vocabulary lists:', error);
                vocabularyListsContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Error loading vocabulary lists. Please try again.
                    </div>
                `;
            });
    }
    
    function deleteVocabulary(id) {
        fetch(`/api/vocabulary/delete/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Remove the card from the UI
                const vocabCard = document.querySelector(`.vocab-card[data-vocab-id="${id}"]`);
                if (vocabCard) {
                    vocabCard.remove();
                    
                    // Check if there are no vocabulary lists left
                    if (document.querySelectorAll('.vocab-card').length === 0) {
                        noVocabMessage.classList.remove('d-none');
                    }
                }
            } else {
                alert('Error deleting vocabulary list: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error deleting vocabulary:', error);
            alert('Error deleting vocabulary list. Please try again.');
        });
    }

    function generateSampleWords(words) {
        // Handle both array and string formats
        let wordList = words;
        if (typeof words === 'string') {
            wordList = words.split(',').map(word => word.trim());
        }

        // Sort the words alphabetically
        wordList.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
        
        // Get up to 5 words to display
        const sampleSize = Math.min(5, wordList.length);
        const sampleWords = wordList.slice(0, sampleSize);

        return sampleWords.map(word => 
            `<span class="badge bg-secondary me-1 mb-1">${escapeHtml(word)}</span>`
        ).join('');
    }

    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
