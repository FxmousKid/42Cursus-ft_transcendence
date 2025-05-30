import { tournamentService } from "./tournament";
import { TournamentService } from "./tournamentService";

interface Match {
    id: number;
    tournament_id: number;
    player1_name: string;
    player2_name: string;
    player1_score: number;
    player2_score: number;
    winner_name: string;
    status: string; // 'scheduled', 'in_progress', 'completed', 'cancelled'
}

class TournamentResults {
    private matches: Match[] = [];
    private matchesContainer: HTMLElement | null = null;
    private backButton: HTMLElement | null = null;

    constructor() {
        this.init();
    }

    private init(): void {
        this.matchesContainer = document.getElementById('matches-container');
        this.backButton = document.getElementById('back-tournament');

        if (this.backButton) {
            this.backButton.addEventListener('click', () => this.goBackToTournament());
        }
    }

    // Method to easily add matches
    public addMatch(match: Match): void {
        this.matches.push(match);
        this.renderMatches();
    }

    // Method to add multiple matches at once
    public addMatches(matches: Match[]): void {
        this.matches.push(...matches);
        this.renderMatches();
    }

    // Method to set all matches (replace existing)
    public setMatches(matches: Match[]): void {
        this.matches = matches;
        this.renderMatches();
    }


    private renderMatches(): void {
        if (!this.matchesContainer) return;

        this.matchesContainer.innerHTML = '';

        this.matches.forEach(match => {
            const matchElement = this.createMatchElement(match);
            this.matchesContainer!.appendChild(matchElement);
        });
    }

    private createMatchElement(match: Match): HTMLElement {
        const matchDiv = document.createElement('div');
		matchDiv.className = "";


        const statusColor = this.getStatusColor(match.status);
        const statusText = this.getStatusText(match.status);

		matchDiv.innerHTML = `
			<div class="bg-dark-800/70 backdrop-blur-md rounded-xl shadow-xl border border-dark-700/70 p-6 my-4 relative overflow-hidden transition-all duration-200 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5">
				<!-- Top accent line -->
				<div class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
				
				<!-- Match header -->
				<div class="text-center mb-6">
					${match.winner_name && match.status === 'completed' ? 
						`<h3 class="text-xl font-semibold text-green-400 flex items-center justify-center mb-3">
							<i class="fas fa-trophy mr-2"></i>
							Victoire de ${match.winner_name}
						</h3>` : 
						`<h3 class="text-xl font-semibold text-white flex items-center justify-center mb-3">
							Match
						</h3>`
					}
					<div class="inline-flex">
						<span class="bg-dark-700/80 text-blue-400 px-4 py-2 rounded-lg font-medium text-sm border border-dark-600 uppercase tracking-wide shadow-inner">
							${statusText}
						</span>
					</div>
				</div>
				
				<!-- Players and score section -->
				<div class="flex items-center justify-between mb-6">
					<!-- Player 1 -->
					<div class="flex-1 text-center">
						<div class="bg-dark-700/50 border border-dark-600/70 rounded-xl p-4 mx-2 transition-colors duration-200 hover:border-blue-500/30">
							<div class="flex items-center justify-center mb-2">
								<div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center border-2 border-dark-500 shadow-inner mr-3">
									<i class="fas fa-user text-white text-sm"></i>
								</div>
								<div>
									<div class="text-blue-400 font-semibold text-lg">
										${match.player1_name}
									</div>
									${match.status === 'completed' && match.winner_name === match.player1_name ? 
										`<div class="flex items-center justify-center mt-1">
											<i class="fas fa-crown text-green-400 mr-1"></i>
											<span class="text-green-400 text-sm font-medium">Gagnant</span>
										</div>` : ''
									}
								</div>
							</div>
						</div>
					</div>
					
					<!-- Score display -->
					<div class="flex-none mx-4">
						<div class="bg-dark-700/90 border-2 border-blue-500/50 rounded-xl px-6 py-4 shadow-xl">
							${match.status === 'completed' || match.status === 'in_progress' ? 
								`<div class="text-center">
									<div class="text-white font-bold text-2xl tracking-wider">
										${match.player1_score} - ${match.player2_score}
									</div>
									<div class="text-blue-400 text-xs uppercase tracking-widest mt-1">Score</div>
								</div>` :
								`<div class="text-center">
									<div class="text-blue-400 font-bold text-xl tracking-wider">VS</div>
									<div class="text-gray-400 text-xs uppercase tracking-widest mt-1">À venir</div>
								</div>`
							}
						</div>
					</div>
					
					<!-- Player 2 -->
					<div class="flex-1 text-center">
						<div class="bg-dark-700/50 border border-dark-600/70 rounded-xl p-4 mx-2 transition-colors duration-200 hover:border-red-500/30">
							<div class="flex items-center justify-center mb-2">
								<div>
									<div class="text-red-400 font-semibold text-lg">
										${match.player2_name}
									</div>
									${match.status === 'completed' && match.winner_name === match.player2_name ? 
										`<div class="flex items-center justify-center mt-1">
											<i class="fas fa-crown text-green-400 mr-1"></i>
											<span class="text-green-400 text-sm font-medium">Gagnant</span>
										</div>` : ''
									}
								</div>
								<div class="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center border-2 border-dark-500 shadow-inner ml-3">
									<i class="fas fa-user text-white text-sm"></i>
								</div>
							</div>
						</div>
					</div>
				</div>
				
				<!-- Match info footer -->
				<div class="border-t border-dark-600/70 pt-4 mt-4">
					<div class="flex items-center justify-between text-sm text-gray-400">
						<div class="flex items-center">
							<i class="fas fa-clock mr-1.5"></i>
							<span>Match ${match.status === 'scheduled' ? 'programmé' : match.status === 'in_progress' ? 'en cours' : 'complété'}</span>
						</div>
					</div>
				</div>
				
				<!-- Bottom accent line -->
				<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
			</div>
		`;
        return matchDiv;
    }

    private getStatusColor(status: string): string {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'in_progress':
                return 'bg-yellow-100 text-yellow-800';
            case 'scheduled':
                return 'bg-blue-100 text-blue-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    private getStatusText(status: string): string {
        switch (status) {
            case 'completed':
                return 'Completed';
            case 'in_progress':
                return 'In Progress';
            case 'scheduled':
                return 'Scheduled';
            case 'cancelled':
                return 'Cancelled';
            default:
                return 'Unknown';
        }
    }

    private goBackToTournament(): void {
        // Replace with your actual navigation logic
        window.location.href = '/tournament_round.html';
    }

    // Public method to get current matches
    public getMatches(): Match[] {
        return [...this.matches];
    }

    // Public method to clear all matches
    public clearMatches(): void {
        this.matches = [];
        this.renderMatches();
    }

    // Public method to update a specific match
    public updateMatch(matchId: number, updatedMatch: Partial<Match>): void {
        const matchIndex = this.matches.findIndex(match => match.id === matchId);
        if (matchIndex !== -1) {
            this.matches[matchIndex] = { ...this.matches[matchIndex], ...updatedMatch };
            this.renderMatches();
        }
    }
}

// Initialize the tournament results page
document.addEventListener('DOMContentLoaded', () => {
    const tournamentResults = new TournamentResults();
	const tournamentService = new TournamentService();

	tournamentService.loadFromStorage();

	tournamentResults.setMatches(tournamentService.matchs);
	document.getElementById('nb-round')!.textContent = 'Round ' + tournamentService.round;
    // Make it globally accessible if needed
    (window as any).tournamentResults = tournamentResults;
});

// Export for use in other modules if needed
export { TournamentResults, Match };