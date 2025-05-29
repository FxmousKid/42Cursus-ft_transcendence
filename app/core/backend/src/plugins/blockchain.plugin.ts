import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { BlockchainService, MatchData } from '../services/blockchain.service';

// Déclaration TypeScript pour ajouter blockchain au type FastifyInstance
declare module 'fastify' {
  interface FastifyInstance {
    blockchain: {
      recordMatch: (matchData: MatchData) => Promise<string | null>;
      getTournamentMatches: (tournamentId: number) => Promise<any[]>;
      isMatchVerified: (tournamentId: number, matchId: number) => Promise<boolean>;
      isAvailable: () => boolean;
      getWalletAddress: () => string | null;
    };
  }
}

/**
 * Plugin Fastify pour la blockchain
 * Pourquoi ? Intégrer le service blockchain dans l'écosystème Fastify
 * de façon propre et réutilisable dans toutes les routes
 */
async function blockchainPlugin(fastify: FastifyInstance) {
  // Créer l'instance du service blockchain
  const blockchainService = new BlockchainService(fastify);

  // Initialiser la connexion blockchain au démarrage
  try {
    await blockchainService.initialize();
    fastify.log.info('Blockchain plugin initialized successfully');
  } catch (error) {
    fastify.log.error('Blockchain plugin initialization failed:', error);
    // On continue sans blockchain plutôt que de faire planter l'app
  }

  // Décorer l'instance Fastify avec les méthodes blockchain
  fastify.decorate('blockchain', {
    /**
     * Enregistre un match sur la blockchain
     * Utilisé dans vos routes après sauvegarde SQLite
     */
    recordMatch: async (matchData: MatchData): Promise<string | null> => {
      return blockchainService.recordMatchOnBlockchain(matchData);
    },

    /**
     * Récupère les matchs d'un tournoi depuis la blockchain
     * Utilisé pour vérification et affichage
     */
    getTournamentMatches: async (tournamentId: number) => {
      return blockchainService.getTournamentMatchesFromBlockchain(tournamentId);
    },

    /**
     * Vérifie si un match spécifique est sur la blockchain
     * Utilisé pour afficher le statut "vérifié"
     */
    isMatchVerified: async (tournamentId: number, matchId: number): Promise<boolean> => {
      return blockchainService.isMatchVerified(tournamentId, matchId);
    },

    /**
     * Vérifie si la blockchain est disponible
     */
    isAvailable: (): boolean => {
      return blockchainService.isAvailable();
    },

    /**
     * Récupère l'adresse du wallet
     */
    getWalletAddress: (): string | null => {
      return blockchainService.getWalletAddress();
    }
  });

  // Hook de fermeture propre (optionnel)
  fastify.addHook('onClose', async () => {
    fastify.log.info('Closing blockchain connections...');
    // Nettoyer le réseau blockchain local si nécessaire
    await blockchainService.cleanup();
  });
}

// Export du plugin avec fastify-plugin pour l'encapsulation
export default fp(blockchainPlugin, {
  name: 'blockchain-plugin',
  dependencies: [] // Pas de dépendances spécifiques
}); 