// This script removes the Recent Chats section from the UI
document.addEventListener('DOMContentLoaded', function() {
    // Function to remove Recent Chats section
    function removeRecentChats() {
        // Method 1: Find card headers with text "Recent Chats"
        const headers = document.querySelectorAll('.card-header');
        headers.forEach(header => {
            if (header.textContent.trim().includes('Recent Chats')) {
                const card = header.closest('.card');
                if (card) card.remove();
            }
        });
        
        // Method 2: Find headings with text "Recent Chats"
        const headings = document.querySelectorAll('h5');
        headings.forEach(heading => {
            if (heading.textContent.trim().includes('Recent Chats')) {
                const card = heading.closest('.card');
                if (card) card.remove();
            }
        });
        
        // Method 3: Find any element containing "Recent Chats" and remove its closest card parent
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
            if (el.childNodes && el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
                if (el.childNodes[0].textContent.trim() === 'Recent Chats') {
                    const card = el.closest('.card');
                    if (card) card.remove();
                }
            }
        });
    }
    
    // Call immediately
    removeRecentChats();
    
    // Also call after a slight delay to catch dynamically added elements
    setTimeout(removeRecentChats, 100);
    setTimeout(removeRecentChats, 500);
    setTimeout(removeRecentChats, 1000);
});