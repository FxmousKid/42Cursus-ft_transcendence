// Import auth service and setup function from api
// These will be imported as globals when compiled to JS
import { authService } from './auth';
import { setAuthService } from './api';

// Initialize app
function initApp() {
  // Set auth service reference in API module
  setAuthService(authService);
  
  // Initialize auth service
  authService.init();
  
  // Add favicon link to head
  const favicon = document.createElement('link');
  favicon.rel = 'shortcut icon';
  favicon.type = 'image/x-icon';
  favicon.href = '/favicon.ico';
  document.head.appendChild(favicon);
}

// Attach to window object to make it globally available
(window as any).initApp = initApp;

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initApp();
}); 