import { api } from './api';
import { TournamentService } from './tournamentService';

export const tournamentService = new TournamentService();

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
    const container = document.createElement(`div`);
    container.className = 'flex items-center gap-2';

    const input = document.createElement('input');
    input.type = 'text';
    input.name = `player${index}`;
    input.placeholder = `Player ${index}`;
    input.required = true;
    input.className = 'flex-1 p-2 rounded-lg border bg-blue-800 border-gray-800';

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
        updatePlayerIndices();
    });
    container.appendChild(input);
    container.appendChild(removeBtn);

    return container;
}

function updatePlayerIndices() {
  const containers = form.querySelectorAll('.flex.items-center.gap-2');
  containers.forEach((container, index) => {
    const input = container.querySelector('input');
    if (input) {
      const newIndex = index + 1;
      input.name = `player${newIndex}`;
      input.placeholder = `Player ${newIndex}`;
    }
  });
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

function suffleArray(array: string[]) {
  for (let i = array.length - 1; i > 0; i--) { 
    const j = Math.floor(Math.random() * (i + 1)); 
    [array[i], array[j]] = [array[j], array[i]]; 
  }
  return array;
}; 


async function createTournament(users: string[]) {

    if (!api || !api.tournament) {
        throw Error("Api doesnt exit");
    }

    const apiRespondProfile = await api.user.getProfile();

    let host_id = apiRespondProfile.data.id;

    console.log('Starting with players:', users);

    users = suffleArray(users);

    const apiRespond = await api.tournament.createTournament(host_id, users);

    const tournamentValue = apiRespond.data;

    console.log('Tournament create: ', tournamentValue);

    tournamentService.setValue(tournamentValue.id, tournamentValue.users);
    await tournamentService.createMatchs(tournamentValue.users); // creation des matchs
    tournamentService.saveToStorage();

    window.location.href = '/tournament_round.html';
}

startButton.addEventListener('click', () => {
    const names: string[] = Array.from(form.querySelectorAll('input'))
        .map(input => (input as HTMLInputElement).value.trim())
        .filter(name => name !== '');

    if (names.length >= 2) {
        createTournament(names);
    } else {
        alert('Please enter at least 2 player names.');
    }
});
