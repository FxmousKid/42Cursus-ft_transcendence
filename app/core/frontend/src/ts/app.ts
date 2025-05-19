// This file will be compiled to JS and included in the HTML directly
// It initializes the app and connects global services

// Initialize app
function initApp() {
  console.log('App initialization started');
  
  // Get services from global scope
  const authService = (window as any).authService;
  const api = (window as any).api;
  
  // Log initialization info
  console.log('Auth service available:', !!authService);
  console.log('API service available:', !!api);
  
  // First, ensure the auth service is properly initialized and user session is restored
  if (authService) {
    // Force restore session to ensure we have the latest auth state
    if (authService.restoreSession) {
      console.log('Restoring user session');
      authService.restoreSession();
    }
    
    // Then initialize auth service (sets up listeners, etc)
    if (authService.init) {
      console.log('Initializing auth service');
      authService.init();
    }
    
    // Log authentication status after initialization
    if (authService.isAuthenticated) {
      const isAuthenticated = authService.isAuthenticated();
      console.log('User authentication status:', isAuthenticated);
      
      if (isAuthenticated) {
        console.log('Authenticated as:', authService.getUsername());
      }
    }
  }
  
  // Set auth service reference in API if needed
  if (api && api.setAuthService && authService) {
    api.setAuthService(authService);
  }
  
  // Add favicon link to head
  const favicon = document.createElement('link');
  favicon.rel = 'shortcut icon';
  favicon.type = 'image/x-icon';
  favicon.href = '/favicon.ico';
  document.head.appendChild(favicon);
  
  console.log('App initialization completed');
}

// Attach to window object to make it globally available
(window as any).initApp = initApp;

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing app');
  initApp();
}); 