import { api } from "./api";
import { TournamentService } from "./tournamentService";

const tournamentService = new TournamentService();

window.addEventListener('DOMContentLoaded', () => {
    tournamentService.loadFromStorage();
    if (!tournamentService) {
        console.log("couldnt find tournament service");
    }
    if (!tournamentService.getCurrentMatch()) {
        console.log("Doesnt have current match");
    } else {
        console.log('Open tournament round with player: ', tournamentService.getCurrentMatch().player1_name, ' ', tournamentService.getCurrentMatch().player2_name);
        document.getElementById('player1')!.textContent = tournamentService.getCurrentMatch().player1_name;
        document.getElementById('player2')!.textContent = tournamentService.getCurrentMatch().player2_name;
        document.getElementById('text-round')!.textContent = "Upcoming Match Round: " + tournamentService.getRound();
    }
});

async function goToNextRound() {
    await tournamentService.finishAndUpdateGame(tournamentService.getCurrentIndex(), 1, 0);

    if (await tournamentService.isFinished()) {
        await api.tournament.updateStatusTournament(tournamentService.id, 'finished');
        window.location.href = "/tournament_finish.html";
        return ;
    }

    await tournamentService.goToNextMatch();

    window.location.href = '/tournament_round.html';
}

async function launchMatch() {
    localStorage.setItem('matchType', JSON.stringify({
			type: 'tournament',
		}));
    window.location.href = `game.html`;
}

document.getElementById('start-match')!.addEventListener('click', () => {
    console.log('yooo');
    if (!tournamentService) {
        console.log("couldnt find tournament service");
    }
    if (!tournamentService.getCurrentMatch()) {
        console.log("Doesnt have current match");
    } else {
        console.log(`Starting match: ${tournamentService.getCurrentMatch().player1_name} vs ${tournamentService.getCurrentMatch().player2_name}`);
    }
    //goToNextRound();
    launchMatch();
});
