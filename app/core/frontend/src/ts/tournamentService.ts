
import { api } from "./api";

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

export class TournamentService {

	id: number;
	round: number;
	users: string[];
	winners: string[];
	matchs: Match[];
	current: number = 0;

	constructor() {
		this.id = 0;
		this.users = [];
		this.round = 1;
		this.matchs = new Array();
		this.winners = new Array();
	}

	async setValue(id: number, users: string[]) {
		this.id = id;
		this.users = users;
	}

	async saveToStorage() {
		localStorage.setItem('tournamentData', JSON.stringify({
			id: this.id,
			round: this.round,
			users: this.users,
			matchs: this.matchs,
			current: this.current,
			winners: this.winners,
		}));
	}

	async loadFromStorage() {
        const saved = localStorage.getItem('tournamentData');
        if (saved) {
            const data = JSON.parse(saved); 
			this.id = data.id;
			this.round = data.round;
			this.users = data.users;
			this.matchs = data.matchs;
			this.current = data.current;
			this.winners = data.winners;
        }
    }

	async createMatchs(names: string[]) {
		this.matchs = new Array();
		let odd = 0;
		if (names.length % 2 == 1) {
			odd = 1;
			this.winners.push(names[names.length - 1]);
		}
		for (let i = 0; i < names.length - odd; i += 2) {
			const apiRespond = await api.tournament.createMatchTournament( this.id, names[i], names[i + 1] );
			this.matchs.push( apiRespond.data );
			console.log('Tournament Match create: ', apiRespond.data);
		}
	}

	async finishAndUpdateGame(index: number, player1_score: number, player2_score: number) {
		this.matchs[index].player1_score = player1_score;
		this.matchs[index].player2_score = player2_score;
		this.matchs[index].winner_name = (player1_score > player2_score) ? this.matchs[index].player1_name : this.matchs[index].player2_name;
		this.matchs[index].status = 'completed';
		this.winners.push( this.matchs[index].winner_name );

		await api.tournament.updateScoreMatchTournament( this.matchs[index].id, this.matchs[index].player1_score,
			this.matchs[index].player2_score, this.matchs[index].winner_name );
		this.saveToStorage();
	}

	async goToNextMatch() {
		this.current++;
		if (this.current >= this.matchs.length) {
			if (this.winners.length > 1) {
				await this.goToNextRound();
				await this.saveToStorage();
			}
		}
		await this.saveToStorage();
		window.location.href = '/tournament_show.html';
	}

	async isFinished() {
		return (this.current + 1 >= this.matchs.length && this.winners.length == 1);
	}

	async goToNextRound() {
		this.round++;
		this.current = 0;

		await this.createMatchs(this.winners);

		this.winners = new Array();
	}

	getCurrentMatch() {
		return this.matchs[this.current];
	}

	getCurrentIndex() {
		return this.current;
	}

	getRound() {
		return this.round;
	}
}