// Example values (you can populate dynamically from sessionStorage, URL, etc.)
const player1 = 'Alice';
const player2 = 'Bob';

document.getElementById('player1')!.textContent = player1;
document.getElementById('player2')!.textContent = player2;

document.getElementById('start-match')!.addEventListener('click', () => {
    alert(`Starting match: ${player1} vs ${player2}`);
    // Redirect or trigger match logic here
});
