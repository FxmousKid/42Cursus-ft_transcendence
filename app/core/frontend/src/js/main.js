import { authUtils } from './utils/auth';
import { router } from './utils/router';
import { toastUtils } from './utils/toast';
import { renderHome } from './pages/home';
import { renderLogin } from './pages/login';
import { renderProfile } from './pages/profile';
import { renderGame } from './pages/game';
import { renderNotFound } from './pages/not-found';
import { renderLeaderboard } from './pages/leaderboard';
// Define routes
const routes = [
    {
        path: '/',
        title: 'Home',
        requiresAuth: false,
        render: renderHome
    },
    {
        path: '/login',
        title: 'Login',
        requiresAuth: false,
        render: renderLogin
    },
    {
        path: '/profile',
        title: 'Profile',
        requiresAuth: true,
        render: renderProfile
    },
    {
        path: '/game',
        title: 'Game',
        requiresAuth: true,
        render: renderGame
    },
    {
        path: '/leaderboard',
        title: 'Leaderboard',
        requiresAuth: false,
        render: renderLeaderboard
    },
    {
        path: '*',
        title: 'Not Found',
        requiresAuth: false,
        render: renderNotFound
    }
];
// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    // Register routes
    router.registerRoutes(routes);
    // Listen for authentication changes
    authUtils.addAuthStateListener((user) => {
        // Update UI based on auth state
        const homeLink = document.getElementById('home-link');
        if (homeLink) {
            homeLink.textContent = user ? 'Transcendence' : 'Transcendence';
        }
    });
    // Start the router
    router.start();
    // Show welcome toast
    toastUtils.info('Welcome to Transcendence!');
});
//# sourceMappingURL=main.js.map