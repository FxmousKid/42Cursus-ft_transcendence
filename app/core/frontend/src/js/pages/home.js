import { authUtils } from '../utils/auth';
import { router } from '../utils/router';
export function renderHome() {
    const appContainer = document.getElementById('app-container');
    if (!appContainer)
        return;
    const isAuthenticated = authUtils.isAuthenticated();
    const homeContent = document.createElement('div');
    homeContent.className = 'flex flex-col items-center justify-center py-12';
    // Hero section
    const heroSection = document.createElement('section');
    heroSection.className = 'text-center mb-16';
    const title = document.createElement('h1');
    title.className = 'text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600';
    title.textContent = 'Welcome to Transcendence';
    const subtitle = document.createElement('p');
    subtitle.className = 'text-xl text-gray-300 max-w-2xl mx-auto mb-8';
    subtitle.textContent = 'Experience the classic game of Pong like never before with multiplayer matches, tournaments, and more!';
    const ctaButton = document.createElement('button');
    ctaButton.className = 'btn btn-primary text-lg px-8 py-3';
    ctaButton.textContent = isAuthenticated ? 'Play Now' : 'Get Started';
    ctaButton.addEventListener('click', () => {
        router.navigateTo(isAuthenticated ? '/game' : '/login');
    });
    heroSection.appendChild(title);
    heroSection.appendChild(subtitle);
    heroSection.appendChild(ctaButton);
    // Features section
    const featuresSection = document.createElement('section');
    featuresSection.className = 'grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16';
    const features = [
        {
            title: 'Multiplayer Matches',
            description: 'Challenge friends or random players to exciting Pong matches in real-time.',
            icon: '<svg class="w-12 h-12 text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>'
        },
        {
            title: 'Tournaments',
            description: 'Participate in tournaments to climb the ranks and prove your skills.',
            icon: '<svg class="w-12 h-12 text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>'
        },
        {
            title: 'Live Chat',
            description: 'Chat with other players during matches and make new friends.',
            icon: '<svg class="w-12 h-12 text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>'
        }
    ];
    features.forEach(feature => {
        const featureCard = document.createElement('div');
        featureCard.className = 'card p-6 flex flex-col items-center text-center';
        const iconContainer = document.createElement('div');
        iconContainer.innerHTML = feature.icon;
        const featureTitle = document.createElement('h3');
        featureTitle.className = 'text-xl font-bold mb-2';
        featureTitle.textContent = feature.title;
        const featureDescription = document.createElement('p');
        featureDescription.className = 'text-gray-300';
        featureDescription.textContent = feature.description;
        featureCard.appendChild(iconContainer);
        featureCard.appendChild(featureTitle);
        featureCard.appendChild(featureDescription);
        featuresSection.appendChild(featureCard);
    });
    // About section
    const aboutSection = document.createElement('section');
    aboutSection.className = 'text-center max-w-3xl mx-auto';
    const aboutTitle = document.createElement('h2');
    aboutTitle.className = 'text-3xl font-bold mb-4';
    aboutTitle.textContent = 'About the Project';
    const aboutText = document.createElement('p');
    aboutText.className = 'text-gray-300 mb-6';
    aboutText.textContent = 'Transcendence is a 42 school project that reimagines the classic Pong game with modern web technologies. Built with TypeScript and TailwindCSS, it offers a sleek, responsive gaming experience.';
    const projectButton = document.createElement('a');
    projectButton.href = 'https://github.com/yourusername/transcendence';
    projectButton.target = '_blank';
    projectButton.className = 'btn btn-secondary';
    projectButton.textContent = 'View on GitHub';
    aboutSection.appendChild(aboutTitle);
    aboutSection.appendChild(aboutText);
    aboutSection.appendChild(projectButton);
    // Assemble the page
    homeContent.appendChild(heroSection);
    homeContent.appendChild(featuresSection);
    homeContent.appendChild(aboutSection);
    appContainer.appendChild(homeContent);
}
//# sourceMappingURL=home.js.map