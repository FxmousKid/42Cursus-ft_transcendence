// This file will be compiled to JS and included in the HTML directly
// It initializes the app and connects global services

// Initialize app
function initApp() {
  // Get services from global scope
  const authService = (window as any).authService;
  const api = (window as any).api;
  
  // Set auth service reference in API if needed
  if (api && api.setAuthService && authService) {
    api.setAuthService(authService);
  }
  
  // Initialize auth service if available
  if (authService && authService.init) {
    authService.init();
  }
  
  // Add favicon link to head
  const favicon = document.createElement('link');
  favicon.rel = 'shortcut icon';
  favicon.type = 'image/x-icon';
  favicon.href = '/favicon.ico';
  document.head.appendChild(favicon);
  
  console.log('App initialized');
}

// Attach to window object to make it globally available
(window as any).initApp = initApp;

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing app');
  initApp();
}); 