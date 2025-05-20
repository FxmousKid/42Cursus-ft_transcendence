import { userApi } from '../services/api';
import { router } from '../utils/router';
export function renderLeaderboard() {
    const appContainer = document.getElementById('app-container');
    if (!appContainer)
        return;
    // Create leaderboard container
    const leaderboardContainer = document.createElement('div');
    leaderboardContainer.className = 'container mx-auto px-4 py-8';
    // Leaderboard header
    const header = document.createElement('div');
    header.className = 'text-center mb-8';
    const title = document.createElement('h1');
    title.className = 'text-3xl font-bold mb-2';
    title.textContent = 'Leaderboard';
    const subtitle = document.createElement('p');
    subtitle.className = 'text-gray-300';
    subtitle.textContent = 'Top players ranked by ELO rating';
    header.appendChild(title);
    header.appendChild(subtitle);
    // Loading state
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'flex justify-center items-center py-12';
    loadingIndicator.innerHTML = '<div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>';
    // Create table container
    const tableContainer = document.createElement('div');
    tableContainer.className = 'bg-gray-800 rounded-lg shadow overflow-hidden';
    // Add elements to container
    leaderboardContainer.appendChild(header);
    leaderboardContainer.appendChild(loadingIndicator);
    leaderboardContainer.appendChild(tableContainer);
    // Add to main container
    appContainer.appendChild(leaderboardContainer);
    // Fetch leaderboard data
    fetchLeaderboard(tableContainer, loadingIndicator);
}
async function fetchLeaderboard(container, loadingElement) {
    try {
        const response = await userApi.getLeaderboard();
        if (response.success && response.data) {
            // Remove loading indicator
            loadingElement.style.display = 'none';
            // Render leaderboard with data
            renderLeaderboardTable(container, response.data);
        }
        else {
            // Show error message
            loadingElement.style.display = 'none';
            container.innerHTML = `
        <div class="text-center py-12">
          <h2 class="text-2xl font-bold text-red-500 mb-4">Error Loading Leaderboard</h2>
          <p class="text-gray-300">${response.error || 'Failed to load leaderboard data'}</p>
          <button class="btn btn-primary mt-4" id="retry-button">Retry</button>
        </div>
      `;
            // Add retry button handler
            const retryButton = document.getElementById('retry-button');
            if (retryButton) {
                retryButton.addEventListener('click', () => {
                    container.innerHTML = '';
                    loadingElement.style.display = 'flex';
                    fetchLeaderboard(container, loadingElement);
                });
            }
        }
    }
    catch (error) {
        // Show error message
        loadingElement.style.display = 'none';
        container.innerHTML = `
      <div class="text-center py-12">
        <h2 class="text-2xl font-bold text-red-500 mb-4">Error Loading Leaderboard</h2>
        <p class="text-gray-300">An unexpected error occurred</p>
        <button class="btn btn-primary mt-4" id="retry-button">Retry</button>
      </div>
    `;
        // Add retry button handler
        const retryButton = document.getElementById('retry-button');
        if (retryButton) {
            retryButton.addEventListener('click', () => {
                container.innerHTML = '';
                loadingElement.style.display = 'flex';
                fetchLeaderboard(container, loadingElement);
            });
        }
        console.error('Error fetching leaderboard:', error);
    }
}
function renderLeaderboardTable(container, users) {
    // Sort users by rank
    const sortedUsers = [...users].sort((a, b) => a.stats.rank - b.stats.rank);
    // Create table
    const table = document.createElement('table');
    table.className = 'min-w-full divide-y divide-gray-700';
    // Create table header
    const thead = document.createElement('thead');
    thead.className = 'bg-gray-700';
    const headerRow = document.createElement('tr');
    const headers = [
        { text: 'Rank', className: 'px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-16' },
        { text: 'Player', className: 'px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider' },
        { text: 'ELO', className: 'px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-20' },
        { text: 'Win Rate', className: 'px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-24' },
        { text: 'W/L', className: 'px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-20' },
        { text: 'Games', className: 'px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-20' }
    ];
    headers.forEach(header => {
        const th = document.createElement('th');
        th.scope = 'col';
        th.className = header.className;
        th.textContent = header.text;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    // Create table body
    const tbody = document.createElement('tbody');
    tbody.className = 'bg-gray-800 divide-y divide-gray-700';
    if (sortedUsers.length === 0) {
        const emptyRow = document.createElement('tr');
        const emptyCell = document.createElement('td');
        emptyCell.colSpan = 6;
        emptyCell.className = 'px-6 py-4 text-center text-gray-400';
        emptyCell.textContent = 'No players found';
        emptyRow.appendChild(emptyCell);
        tbody.appendChild(emptyRow);
    }
    else {
        sortedUsers.forEach((userProfile, index) => {
            const { user, stats } = userProfile;
            const row = document.createElement('tr');
            row.className = index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750';
            // Rank cell
            const rankCell = document.createElement('td');
            rankCell.className = 'px-6 py-4 whitespace-nowrap';
            const rankSpan = document.createElement('span');
            rankSpan.className = 'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-900 text-blue-300';
            rankSpan.textContent = `#${stats.rank}`;
            rankCell.appendChild(rankSpan);
            // Player cell
            const playerCell = document.createElement('td');
            playerCell.className = 'px-6 py-4 whitespace-nowrap';
            const playerDiv = document.createElement('div');
            playerDiv.className = 'flex items-center';
            const avatarDiv = document.createElement('div');
            avatarDiv.className = 'flex-shrink-0 h-10 w-10';
            const avatarImg = document.createElement('img');
            avatarImg.className = 'h-10 w-10 rounded-full object-cover';
            avatarImg.src = user.avatar_url || 'https://via.placeholder.com/40';
            avatarImg.alt = user.username;
            const playerInfoDiv = document.createElement('div');
            playerInfoDiv.className = 'ml-4';
            const playerName = document.createElement('div');
            playerName.className = 'text-sm font-medium text-white';
            playerName.textContent = user.username;
            const playerStatus = document.createElement('div');
            playerStatus.className = 'flex items-center text-sm text-gray-400';
            const statusDot = document.createElement('div');
            statusDot.className = `w-2 h-2 mr-1 rounded-full ${getStatusColor(user.status)}`;
            const statusText = document.createElement('span');
            statusText.textContent = user.status;
            playerStatus.appendChild(statusDot);
            playerStatus.appendChild(statusText);
            playerInfoDiv.appendChild(playerName);
            playerInfoDiv.appendChild(playerStatus);
            avatarDiv.appendChild(avatarImg);
            playerDiv.appendChild(avatarDiv);
            playerDiv.appendChild(playerInfoDiv);
            playerCell.appendChild(playerDiv);
            // ELO cell
            const eloCell = document.createElement('td');
            eloCell.className = 'px-6 py-4 whitespace-nowrap';
            const eloSpan = document.createElement('span');
            eloSpan.className = 'text-sm font-semibold text-white';
            eloSpan.textContent = stats.elo.toString();
            eloCell.appendChild(eloSpan);
            // Win Rate cell
            const winRateCell = document.createElement('td');
            winRateCell.className = 'px-6 py-4 whitespace-nowrap';
            const winRateSpan = document.createElement('span');
            winRateSpan.className = 'text-sm text-white';
            winRateSpan.textContent = `${Math.round(stats.win_rate * 100)}%`;
            winRateCell.appendChild(winRateSpan);
            // W/L cell
            const wlCell = document.createElement('td');
            wlCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-white';
            wlCell.textContent = `${stats.wins}/${stats.losses}`;
            // Games cell
            const gamesCell = document.createElement('td');
            gamesCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-white';
            gamesCell.textContent = stats.total_matches.toString();
            // Add cells to row
            row.appendChild(rankCell);
            row.appendChild(playerCell);
            row.appendChild(eloCell);
            row.appendChild(winRateCell);
            row.appendChild(wlCell);
            row.appendChild(gamesCell);
            // Add click handler to view profile
            row.addEventListener('click', () => {
                // Normally would navigate to user profile
                router.navigateTo(`/profile`); // In a real app: `/profile/${user.id}`
            });
            row.style.cursor = 'pointer';
            // Add hover effect
            row.addEventListener('mouseenter', () => {
                row.classList.add('bg-gray-700');
            });
            row.addEventListener('mouseleave', () => {
                row.classList.remove('bg-gray-700');
            });
            // Add to tbody
            tbody.appendChild(row);
        });
    }
    table.appendChild(tbody);
    container.appendChild(table);
}
function getStatusColor(status) {
    switch (status) {
        case 'online':
            return 'bg-green-500';
        case 'away':
            return 'bg-yellow-500';
        case 'in_game':
            return 'bg-blue-500';
        default:
            return 'bg-gray-500';
    }
}
//# sourceMappingURL=leaderboard.js.map