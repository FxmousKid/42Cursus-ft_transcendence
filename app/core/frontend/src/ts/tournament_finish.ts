// Get winner name from URL parameters or storage

import { TournamentService } from "./tournamentService";

const tournamentService = new TournamentService;

// Create extra confetti burst effect
function createExtraConfetti(x: number, y: number): void {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#a29bfe', '#fd79a8', '#00b894'];
    
    for (let i = 0; i < 10; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.left = x + 'px';
        confetti.style.top = y + 'px';
        confetti.style.width = '8px';
        confetti.style.height = '8px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = '1000';
        confetti.style.borderRadius = '50%';
        
        const angle = (Math.random() * 360) * Math.PI / 180;
        const velocity = Math.random() * 300 + 100;
        const life = Math.random() * 1000 + 1000;
        
        const animation = confetti.animate([
            {
                transform: `translate(0, 0) scale(1)`,
                opacity: 1
            },
            {
                transform: `translate(${Math.cos(angle) * velocity}px, ${Math.sin(angle) * velocity + 200}px) scale(0)`,
                opacity: 0
            }
        ], {
            duration: life,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });
        
        animation.onfinish = () => confetti.remove();
        document.body.appendChild(confetti);
    }
}

// Set winner name when page loads
window.addEventListener('DOMContentLoaded', () => {
    tournamentService.loadFromStorage();
    if (!tournamentService.winners) {
        console.log("Can't load winner");
    }
    console.log("Update Winner name: ", tournamentService.winners[0]);
    document.getElementById('winner-name')!.textContent = tournamentService.winners[0];
});

// Back button functionality
const backButton = document.getElementById('back-button');
if (backButton) {
    backButton.addEventListener('click', () => {
        // Navigate back to main menu
        window.location.href = '/tournament.html';
    });
}

// Add some extra confetti on click
document.addEventListener('click', (e: MouseEvent) => {
    createExtraConfetti(e.clientX, e.clientY);
});