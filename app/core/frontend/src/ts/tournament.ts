const form = document.getElementById('player-form') as HTMLFormElement;
const addButton = document.getElementById('add-player') as HTMLButtonElement;
const startButton = document.getElementById('start-button') as HTMLButtonElement;

let playerCount = 0;
const maxPlayers = 16;

function updateStartVisibility() {
    const inputs = form.querySelectorAll('input');
    startButton.classList.toggle('hidden', inputs.length < 2);
}

function createPlayerField(index: number) {
    const container = document.createElement('div');
    container.className = 'flex items-center gap-2';

    const input = document.createElement('input');
    input.type = 'text';
    input.name = `player${index}`;
    input.placeholder = `Player ${index}`;
    input.required = true;
    input.className = 'flex-1 p-2 rounded-lg border border-gray-300';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '❌';
    removeBtn.className = 'text-red-500 hover:text-red-700 font-bold px-2';
    removeBtn.addEventListener('click', () => {
        form.removeChild(container);
        playerCount--;
        updateStartVisibility();
        if (playerCount < maxPlayers) {
            addButton.disabled = false;
            addButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    });

    container.appendChild(input);
    container.appendChild(removeBtn);

    return container;
}

function addPlayerField() {
    if (playerCount >= maxPlayers) return;
    playerCount++;
    const field = createPlayerField(playerCount);
    form.appendChild(field);

    updateStartVisibility();

    if (playerCount >= maxPlayers) {
        addButton.disabled = true;
        addButton.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

// Initial field
addPlayerField();

addButton.addEventListener('click', () => {
    addPlayerField();
});

startButton.addEventListener('click', () => {
    const names: string[] = Array.from(form.querySelectorAll('input'))
        .map(input => (input as HTMLInputElement).value.trim())
        .filter(name => name !== '');

    if (names.length >= 2) {
        console.log('Starting with players:', names);
        alert(`Game starting with players: ${names.join(', ')}`);
    } else {
        alert('Please enter at least 2 player names.');
    }
});
