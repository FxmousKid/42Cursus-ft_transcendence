import { router } from '../utils/router';
export function renderNotFound() {
    const appContainer = document.getElementById('app-container');
    if (!appContainer)
        return;
    // Create not found container
    const notFoundContainer = document.createElement('div');
    notFoundContainer.className = 'flex flex-col items-center justify-center py-16 px-4';
    // 404 title
    const title = document.createElement('h1');
    title.className = 'text-6xl font-bold mb-6 text-blue-500';
    title.textContent = '404';
    // Subtitle
    const subtitle = document.createElement('h2');
    subtitle.className = 'text-3xl font-semibold mb-4';
    subtitle.textContent = 'Page Not Found';
    // Description
    const description = document.createElement('p');
    description.className = 'text-gray-400 text-center max-w-md mb-8';
    description.textContent = 'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.';
    // Home button
    const homeButton = document.createElement('button');
    homeButton.className = 'btn btn-primary text-lg px-8 py-3';
    homeButton.textContent = 'Go to Homepage';
    homeButton.addEventListener('click', () => {
        router.navigateTo('/');
    });
    // Add animation
    const animation = document.createElement('div');
    animation.className = 'mb-8';
    // Simple ping-pong ball animation using SVG
    animation.innerHTML = `
    <svg width="200" height="100" viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
      <!-- Table -->
      <rect x="20" y="90" width="160" height="4" fill="#4b5563"/>
      
      <!-- Left paddle -->
      <rect x="20" y="60" width="5" height="30" fill="white"/>
      
      <!-- Right paddle -->
      <rect x="175" y="60" width="5" height="30" fill="white"/>
      
      <!-- Ball with animation -->
      <circle id="ball" cx="100" cy="75" r="6" fill="#3b82f6">
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0,0; 50,-30; 75,0; 0,0; -50,-30; -75,0; 0,0"
          dur="3s"
          repeatCount="indefinite"
        />
      </circle>
      
      <!-- Net -->
      <line x1="100" y1="90" x2="100" y2="60" stroke="#4b5563" stroke-width="2" stroke-dasharray="5,5"/>
    </svg>
  `;
    // Assemble the page
    notFoundContainer.appendChild(title);
    notFoundContainer.appendChild(subtitle);
    notFoundContainer.appendChild(description);
    notFoundContainer.appendChild(animation);
    notFoundContainer.appendChild(homeButton);
    // Add to container
    appContainer.appendChild(notFoundContainer);
}
//# sourceMappingURL=not-found.js.map