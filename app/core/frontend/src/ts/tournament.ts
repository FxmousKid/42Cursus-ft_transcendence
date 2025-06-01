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

function createPlayerField(index: number, first: boolean) {
    const container = document.createElement(`div`);
    container.className = 'bg-dark-700/50 border border-dark-600/70 rounded-xl p-4 transition-custom hover:border-blue-500/30 relative flex items-center gap-3';

    const input = document.createElement('input');
    input.type = 'text';
    input.name = `player${index}`;
    input.placeholder = `Player ${index}`;
    input.required = true;
    input.className = 'bg-blue-800 border border-gray-800 text-gray-200 rounded-xl py-3 px-4 shadow-inner focus:outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/50 transition-custom placeholder-gray-400';
    input.style.width = 'calc(100% - 44px)'; // Reserve space for remove button (32px + 12px gap)

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
    removeBtn.className = 'w-8 h-8 bg-dark-600/60 hover:bg-red-500/80 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-custom text-sm opacity-70 hover:opacity-100 flex-shrink-0';
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
    if (!first) {
        container.appendChild(removeBtn);
    }
    return container;
}

function updatePlayerIndices() {
  const containers = form.querySelectorAll('.flex.items-center.gap-3');
  containers.forEach((container, index) => {
    const input = container.querySelector('input');
    if (input) {
      const newIndex = index + 1;
      input.name = `player${newIndex}`;
      input.placeholder = `Player ${newIndex}`;
    }
  });
}

function addPlayerField(first: boolean) {
    if (playerCount >= maxPlayers) return;
    playerCount++;
    const field = createPlayerField(playerCount, first);
    form.appendChild(field);

    updateStartVisibility();

    if (playerCount >= maxPlayers) {
        addButton.disabled = true;
        addButton.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

// Initial field
addPlayerField(true);

addButton.addEventListener('click', () => {
    addPlayerField(false);
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

    window.location.href = '/tournament_show.html';
}

startButton.addEventListener('click', () => {
    const names: string[] = Array.from(form.querySelectorAll('input'))
        .map(input => (input as HTMLInputElement).value.trim())
        .filter(name => name !== '');

    

    if (names.length >= 2) {
        for (let i = 0; i < names.length; i++) {
            for (let j = 0; j < names.length; j++) {
                if (names[i] == names[j] && i != j) {
                    alert('Please enter different names: ' + names[i]);
                    return;
                }
            }
        }
        createTournament(names);
    } else {
        alert('Please enter at least 2 player names.');
    }
});
