import { authUtils } from './auth';
import { toastUtils } from './toast';
// Router singleton
export class Router {
    constructor() {
        Object.defineProperty(this, "routes", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "currentPath", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ''
        });
        Object.defineProperty(this, "container", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "loading", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        // Initialize
        this.initializeRouter();
    }
    static getInstance() {
        if (!Router.instance) {
            Router.instance = new Router();
        }
        return Router.instance;
    }
    initializeRouter() {
        // Get main content container
        this.container = document.getElementById('app-container');
        this.loading = document.getElementById('loading-indicator');
        // Set initial path
        this.currentPath = window.location.pathname;
        // Listen for navigation events
        window.addEventListener('popstate', () => {
            this.navigateTo(window.location.pathname);
        });
        // Handle link clicks
        document.addEventListener('click', (e) => {
            const target = e.target;
            const link = target.closest('a');
            if (link && link.href && link.href.startsWith(window.location.origin)) {
                e.preventDefault();
                this.navigateTo(new URL(link.href).pathname);
            }
        });
    }
    // Register routes
    registerRoutes(routes) {
        this.routes = routes;
        this.updateNavMenu();
    }
    // Update navigation menu
    updateNavMenu() {
        const navMenu = document.getElementById('nav-menu');
        const authButtons = document.getElementById('auth-buttons');
        if (!navMenu || !authButtons)
            return;
        // Clear existing items
        navMenu.innerHTML = '';
        authButtons.innerHTML = '';
        // Get auth state
        const isAuthenticated = authUtils.isAuthenticated();
        // Add navigation links
        this.routes.forEach(route => {
            // Skip routes that require different auth state
            if ((route.requiresAuth && !isAuthenticated) || (route.path === '/login' && isAuthenticated)) {
                return;
            }
            // Create link for main navigation items
            if (route.path !== '/login') {
                const link = document.createElement('a');
                link.href = route.path;
                link.textContent = route.title;
                link.className = 'text-gray-300 hover:text-white font-medium';
                // Highlight active link
                if (this.currentPath === route.path) {
                    link.classList.add('text-white', 'font-bold');
                }
                navMenu.appendChild(link);
            }
        });
        // Show the nav menu after populating it
        navMenu.classList.remove('hidden');
        // Add auth buttons
        if (isAuthenticated) {
            // User is logged in - show profile and logout
            const user = authUtils.getCurrentUser();
            // Profile button
            const profileButton = document.createElement('button');
            profileButton.className = 'text-sm text-gray-300 hover:text-white mr-4';
            profileButton.textContent = user?.username || 'Profile';
            profileButton.addEventListener('click', () => {
                this.navigateTo('/profile');
            });
            // Logout button
            const logoutButton = document.createElement('button');
            logoutButton.className = 'btn btn-danger text-sm';
            logoutButton.textContent = 'Logout';
            logoutButton.addEventListener('click', () => {
                authUtils.clearAuth();
                this.navigateTo('/login');
                toastUtils.success('You have been logged out');
            });
            authButtons.appendChild(profileButton);
            authButtons.appendChild(logoutButton);
        }
        else {
            // User is not logged in - show login button
            const loginButton = document.createElement('a');
            loginButton.href = '/login';
            loginButton.className = 'btn btn-primary text-sm';
            loginButton.textContent = 'Login';
            authButtons.appendChild(loginButton);
        }
    }
    // Navigate to a route
    navigateTo(path) {
        this.currentPath = path;
        // Update browser history
        history.pushState(null, '', path);
        // Find matching route
        const route = this.routes.find(r => r.path === path) ||
            this.routes.find(r => r.path === '*'); // Fallback route
        if (!route) {
            console.error(`No route found for path: ${path}`);
            return;
        }
        // Check authentication
        const isAuthenticated = authUtils.isAuthenticated();
        if (route.requiresAuth && !isAuthenticated) {
            // Redirect to login
            toastUtils.error('You must be logged in to access this page');
            this.navigateTo('/login');
            return;
        }
        // If this is the login page and user is already authenticated
        if (path === '/login' && isAuthenticated) {
            // Redirect to home
            this.navigateTo('/');
            return;
        }
        // Update navigation
        this.updateNavMenu();
        // Show loading
        if (this.loading) {
            this.loading.classList.remove('hidden');
        }
        // Render the route
        if (this.container) {
            // Clear container (except loading indicator)
            Array.from(this.container.children).forEach(child => {
                if (child !== this.loading) {
                    this.container.removeChild(child);
                }
            });
            // Render route content
            setTimeout(() => {
                try {
                    route.render();
                }
                catch (error) {
                    console.error('Error rendering route:', error);
                    toastUtils.error('Something went wrong loading this page');
                }
                // Hide loading
                if (this.loading) {
                    this.loading.classList.add('hidden');
                }
            }, 100); // Small delay to show loading
        }
    }
    // Start the router
    start() {
        this.navigateTo(this.currentPath);
    }
}
// Export singleton instance
export const router = Router.getInstance();
//# sourceMappingURL=router.js.map