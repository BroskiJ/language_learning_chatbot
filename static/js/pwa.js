/**
 * PWA functionality for LanguagePal
 */

// Register the service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Add version timestamp to force updates
    const timestamp = new Date().getTime();
    navigator.serviceWorker.register(`/service-worker.js?v=${timestamp}`)
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
        
        // Force update check on each load
        registration.update();
        
        // Add a cache-busting reload for users seeing old content
        if (sessionStorage.getItem('sw_installed') !== 'true') {
          // Mark as installed to prevent infinite reload loop
          sessionStorage.setItem('sw_installed', 'true');
          // Force hard reload to clear cache issues
          if (navigator.serviceWorker.controller) {
            window.location.reload(true);
          }
        }
      })
      .catch(error => {
        console.error('ServiceWorker registration failed: ', error);
      });
  });
}

// Add iOS-specific enhancements
document.addEventListener('DOMContentLoaded', function() {
  // Check if we're on iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  
  // Check if app is in standalone mode (already installed)
  const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  
  // Only show installation instruction for iOS when not already installed
  if (isIOS && !isInStandaloneMode) {
    // Create installation instructions
    const installInstructions = document.createElement('div');
    installInstructions.className = 'alert alert-info alert-dismissible fade show mt-2';
    installInstructions.setAttribute('role', 'alert');
    installInstructions.innerHTML = `
      <div class="d-flex">
        <div class="me-3">
          <i class="bi bi-phone display-6"></i>
        </div>
        <div>
          <strong>Install LanguagePal on your iPhone!</strong> 
          <p class="mb-0">Tap <i class="bi bi-share"></i> and then "Add to Home Screen" to install this app.</p>
        </div>
      </div>
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Add to beginning of main content
    const mainContent = document.querySelector('main.container');
    if (mainContent) {
      mainContent.prepend(installInstructions);
    }
    
    // Store that we've shown the prompt to avoid showing it repeatedly
    sessionStorage.setItem('installPromptShown', 'true');
  }
  
  // Make iOS standalone experience better - prevent zoom and add rubber-band scrolling
  if (isIOS) {
    // Add extra meta tags for iOS standalone mode
    if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
      const metaCapable = document.createElement('meta');
      metaCapable.setAttribute('name', 'apple-mobile-web-app-capable');
      metaCapable.setAttribute('content', 'yes');
      document.head.appendChild(metaCapable);
    }
    
    // Enhanced UX for standalone mode
    if (isInStandaloneMode) {
      // Apply mobile-specific styles when in installed app mode
      document.body.classList.add('ios-standalone');
      
      // Handle links to open in Safari for external links
      document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (link && link.getAttribute('href').startsWith('http') && link.hostname !== window.location.hostname) {
          e.preventDefault();
          window.open(link.href);
        }
      });
    }
  }
});