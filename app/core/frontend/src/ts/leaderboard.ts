import { api } from './api';
import { UserProfile } from './api';

interface PlayerStats {
  id: number;
  username: string;
  status: string;
  avatar_url?: string;
  games: number;
  wins: number;
  losses: number;
  ratio: number;
}

document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
        // Redirect to login page if not logged in
        window.location.href = '/login.html';
        return;
    }
    
    // DOM elements
    const loadingIndicator = document.getElementById('loading-indicator') as HTMLElement;
    const leaderboardContainer = document.getElementById('leaderboard-container') as HTMLElement;
    const leaderboardRows = document.getElementById('leaderboard-rows') as HTMLElement;
    const noPlayers = document.getElementById('no-players') as HTMLElement;
    const errorMessage = document.getElementById('error-message') as HTMLElement;
    const errorText = document.getElementById('error-text') as HTMLElement;
    const leaderboardSearch = document.getElementById('leaderboard-search') as HTMLInputElement;
    const rowTemplate = document.getElementById('leaderboard-row-template') as HTMLTemplateElement;
    
    // Load leaderboard data
    try {
        // Get users data from API
        const usersResponse = await api.user.getAll();
        
        if (!usersResponse.success) {
            throw new Error(usersResponse.message || 'Failed to load users');
        }
        
        const users = usersResponse.data || [];
        
        if (users.length === 0) {
            loadingIndicator.classList.add('hidden');
            noPlayers.classList.remove('hidden');
            return;
        }
        
        // Get matches data from API
        const matchesResponse = await api.game.getAllMatches();
        
        if (!matchesResponse.success) {
            throw new Error(matchesResponse.message || 'Failed to load matches');
        }
        
        const matches = matchesResponse.data || [];
        
        // Calculate stats for each player
        const playerStats: Record<number, PlayerStats> = {};
        
        // Initialize stats for all users
        users.forEach(user => {
            playerStats[user.id] = {
                id: user.id,
                username: user.username,
                status: user.status,
                avatar_url: user.avatar_url,
                games: 0,
                wins: 0,
                losses: 0,
                ratio: 0
            };
        });
        
        // Calculate stats from matches
        matches.forEach(match => {
            // Increment games played for both players
            if (playerStats[match.player1_id]) {
                playerStats[match.player1_id].games++;
                
                // Determine if player1 won
                if (match.player1_score > match.player2_score) {
                    playerStats[match.player1_id].wins++;
                } else {
                    playerStats[match.player1_id].losses++;
                }
            }
            
            if (playerStats[match.player2_id]) {
                playerStats[match.player2_id].games++;
                
                // Determine if player2 won
                if (match.player2_score > match.player1_score) {
                    playerStats[match.player2_id].wins++;
                } else {
                    playerStats[match.player2_id].losses++;
                }
            }
        });
        
        // Calculate win/loss ratio for all players
        Object.values(playerStats).forEach((player: PlayerStats) => {
            player.ratio = player.games > 0 ? player.wins / player.games : 0;
        });
        
        // Sort players by win ratio (descending)
        const sortedPlayers = Object.values(playerStats).sort((a: PlayerStats, b: PlayerStats) => {
            // Sort by ratio first
            if (b.ratio !== a.ratio) {
                return b.ratio - a.ratio;
            }
            
            // If ratio is the same, sort by total games
            if (b.games !== a.games) {
                return b.games - a.games;
            }
            
            // If games are the same, sort by username
            return a.username.localeCompare(b.username);
        });
        
        // Display the leaderboard
        sortedPlayers.forEach((player: PlayerStats, index: number) => {
            const rowElement = document.importNode(rowTemplate.content, true);
            
            // Set player details
            const rank = rowElement.querySelector('.player-rank') as HTMLElement;
            const username = rowElement.querySelector('.player-username') as HTMLElement;
            const avatar = rowElement.querySelector('.player-avatar') as HTMLElement;
            const statusIndicator = rowElement.querySelector('.player-status-indicator') as HTMLElement;
            const status = rowElement.querySelector('.player-status') as HTMLElement;
            const games = rowElement.querySelector('.player-games') as HTMLElement;
            const wins = rowElement.querySelector('.player-wins') as HTMLElement;
            const losses = rowElement.querySelector('.player-losses') as HTMLElement;
            const ratio = rowElement.querySelector('.player-ratio') as HTMLElement;
            
            // Set values
            rank.textContent = `#${index + 1}`;
            username.textContent = player.username;
            games.textContent = player.games.toString();
            wins.textContent = player.wins.toString();
            losses.textContent = player.losses.toString();
            ratio.textContent = (player.ratio * 100).toFixed(1) + '%';
            
            // Set status
            if (player.status === 'online') {
                statusIndicator.classList.add('bg-green-500');
                status.textContent = 'En ligne';
            } else if (player.status === 'in_game') {
                statusIndicator.classList.add('bg-blue-500');
                status.textContent = 'En jeu';
            } else {
                statusIndicator.classList.add('bg-gray-500');
                status.textContent = 'Hors ligne';
            }
            
            // Set avatar if available
            if (player.avatar_url) {
                avatar.innerHTML = `<img src="${player.avatar_url}" alt="${player.username}" class="w-full h-full object-cover">`;
            }
            
            // Highlight top 3 players
            if (index < 3) {
                const tr = rowElement.querySelector('tr') as HTMLElement;
                if (index === 0) {
                    tr.classList.add('bg-yellow-50');
                    rank.classList.add('text-yellow-600');
                } else if (index === 1) {
                    tr.classList.add('bg-gray-50');
                    rank.classList.add('text-gray-600');
                } else if (index === 2) {
                    tr.classList.add('bg-orange-50');
                    rank.classList.add('text-orange-600');
                }
            }
            
            // Add data attribute for filtering
            const tr = rowElement.querySelector('tr') as HTMLElement;
            tr.dataset.username = player.username.toLowerCase();
            
            // Add to container
            leaderboardRows.appendChild(rowElement);
        });
        
        // Show the leaderboard
        loadingIndicator.classList.add('hidden');
        leaderboardContainer.classList.remove('hidden');
        
        // Filter functionality
        leaderboardSearch.addEventListener('input', () => {
            const searchTerm = leaderboardSearch.value.toLowerCase();
            const rows = leaderboardRows.querySelectorAll('tr');
            
            rows.forEach(row => {
                const username = (row as HTMLElement).dataset.username || '';
                
                if (username.includes(searchTerm)) {
                    (row as HTMLElement).style.display = '';
                } else {
                    (row as HTMLElement).style.display = 'none';
                }
            });
        });
        
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        loadingIndicator.classList.add('hidden');
        errorMessage.classList.remove('hidden');
        errorText.textContent = error instanceof Error ? error.message : 'Failed to load leaderboard';
    }
}); 