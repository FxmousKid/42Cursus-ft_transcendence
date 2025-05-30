import { ethers } from 'ethers';
import { FastifyInstance } from 'fastify';
import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

// Interface pour les données de match à enregistrer
export interface MatchData {
  id: string; // UUID au lieu d'un number
  tournament_id: number;
  player1_name: string;
  player2_name: string;
  player1_score: number;
  player2_score: number;
  winner_name: string;
}

// Interface pour les données blockchain
export interface BlockchainMatchRecord {
  matchId: bigint;
  tournamentId: bigint;
  player1Name: string;
  player2Name: string;
  player1Score: bigint;
  player2Score: bigint;
  winnerName: string;
  timestamp: bigint;
  recordedBy: string;
}

export class BlockchainService {
  private provider: ethers.Provider | null = null;
  private wallet: ethers.Wallet | null = null;
  private contract: ethers.Contract | null = null;
  private fastify: FastifyInstance;
  private hardhatProcess: ChildProcess | null = null;
  
  // ABI du smart contract
  private readonly contractABI = [
    "function recordMatch(uint256 _tournamentId, uint256 _matchId, string memory _player1Name, string memory _player2Name, uint256 _player1Score, uint256 _player2Score, string memory _winnerName) external",
    "function getTournamentMatches(uint256 _tournamentId) external view returns (tuple(uint256 matchId, uint256 tournamentId, string player1Name, string player2Name, uint256 player1Score, uint256 player2Score, string winnerName, uint256 timestamp, address recordedBy)[] memory)",
    "function isMatchRecorded(uint256 _tournamentId, uint256 _matchId) external view returns (bool)",
    "function getTournamentMatchCount(uint256 _tournamentId) external view returns (uint256)"
  ];

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
  }

  /**
   * Convertit un UUID en nombre pour la blockchain
   * Utilise un hash SHA-256 tronqué pour éviter les collisions
   */
  private uuidToBlockchainId(uuid: string): number {
    const hash = crypto.createHash('sha256').update(uuid).digest('hex');
    // Prendre les 8 premiers caractères hex et les convertir en nombre
    // Cela donne un nombre entre 0 et 4,294,967,295 (2^32 - 1)
    return parseInt(hash.substring(0, 8), 16);
  }

  /**
   * Trouve l'UUID correspondant à un ID blockchain
   */
  private async findUuidFromBlockchainId(blockchainId: number, tournamentId: number): Promise<string | null> {
    try {
      // Récupérer tous les matchs de la base de données pour ce tournoi
      const { MatchTournament } = this.fastify.db.models;
      const matches = await MatchTournament.findAll({
        where: { tournament_id: tournamentId }
      });

      // Trouver le match dont l'UUID correspond à cet ID blockchain
      for (const match of matches) {
        if (this.uuidToBlockchainId(match.id) === blockchainId) {
          return match.id;
        }
      }

      return null;
    } catch (error) {
      this.fastify.log.error('Error finding UUID from blockchain ID:', error);
      return null;
    }
  }

  /**
   * Démarre automatiquement le réseau blockchain local si nécessaire
   */
  private async startLocalBlockchain(): Promise<boolean> {
    try {
      // Vérifier si le réseau est déjà en cours d'exécution
      const testProvider = new ethers.JsonRpcProvider('http://localhost:8545');
      await testProvider.getNetwork();
      this.fastify.log.info('Local blockchain network already running');
      return true;
    } catch (error) {
      this.fastify.log.info('Starting local blockchain network...');
      
      try {
        // Démarrer Hardhat node en arrière-plan
        this.hardhatProcess = spawn('npx', ['hardhat', 'node'], {
          cwd: process.cwd(),
          stdio: ['ignore', 'pipe', 'pipe'],
          detached: false
        });

        // Attendre que le réseau soit prêt
        await this.waitForBlockchain();
        this.fastify.log.info('Local blockchain network started successfully');
        return true;
      } catch (startError) {
        this.fastify.log.error('Failed to start local blockchain:', startError);
        return false;
      }
    }
  }

  /**
   * Attend que le réseau blockchain soit prêt
   */
  private async waitForBlockchain(maxAttempts: number = 30): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const testProvider = new ethers.JsonRpcProvider('http://localhost:8545');
        await testProvider.getNetwork();
        return; // Succès
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre 1 seconde
      }
    }
    throw new Error('Blockchain network failed to start within timeout');
  }

  /**
   * Déploie automatiquement le contrat si nécessaire
   */
  private async deployContractIfNeeded(): Promise<string> {
    const contractAddress = process.env.TOURNAMENT_CONTRACT_ADDRESS;
    
    if (contractAddress) {
      try {
        // Vérifier si le contrat existe déjà
        const code = await this.provider!.getCode(contractAddress);
        if (code !== '0x') {
          return contractAddress;
        }
      } catch (error) {
        // Contract verification failed, will redeploy
      }
    }

    // Lire le contrat compilé
    const artifactPath = path.join(process.cwd(), 'blockchain/artifacts/blockchain/contracts/TournamentScores.sol/TournamentScores.json');
    const artifact = JSON.parse(await fs.readFile(artifactPath, 'utf8'));
    
    // Créer la factory et déployer
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, this.wallet);
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    
    const deployedAddress = await contract.getAddress();
    
    return deployedAddress;
  }

  /**
   * Initialise la connexion blockchain avec auto-démarrage
   */
  async initialize(): Promise<void> {
    try {
      const rpcUrl = process.env.AVALANCHE_RPC_URL || 'http://localhost:8545';
      const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;

      if (!privateKey) {
        this.fastify.log.warn('BLOCKCHAIN_PRIVATE_KEY not set, blockchain features disabled');
        return;
      }

      // Déterminer si on est en mode local ou testnet/production
      const isLocalNetwork = rpcUrl.includes('localhost') || rpcUrl.includes('127.0.0.1');
      
      if (isLocalNetwork) {
        // MODE LOCAL : Auto-démarrage du réseau Hardhat
        this.fastify.log.info('Mode LOCAL détecté - Démarrage automatique du réseau Hardhat');
        const networkStarted = await this.startLocalBlockchain();
        if (!networkStarted) {
          throw new Error('Failed to start local blockchain network');
        }
      } else {
        // MODE TESTNET/PRODUCTION : Connexion directe
        this.fastify.log.info('MODE TESTNET détecté');
      }

      // Connexion au réseau
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.wallet = new ethers.Wallet(privateKey, this.provider);

      // Vérifier la connexion
      const network = await this.provider.getNetwork();
      const balance = await this.provider.getBalance(this.wallet.address);
      
      this.fastify.log.info(`Réseau connecté: ${network.name} (chainId: ${network.chainId})`);
      this.fastify.log.info(`Adresse wallet: ${this.wallet.address}`);
      this.fastify.log.info(`Solde: ${ethers.formatEther(balance)} ${isLocalNetwork ? 'ETH' : 'AVAX'}`);

      // Gestion du contrat selon le mode
      let contractAddress = process.env.TOURNAMENT_CONTRACT_ADDRESS;
      
      if (isLocalNetwork) {
        // MODE LOCAL : Auto-déploiement
        contractAddress = await this.deployContractIfNeeded();
      } else {
        // MODE TESTNET/PRODUCTION : Utiliser l'adresse configurée
        if (!contractAddress) {
          throw new Error('TOURNAMENT_CONTRACT_ADDRESS must be set for testnet/production mode');
        }
        
        // Vérifier que le contrat existe
        const code = await this.provider.getCode(contractAddress);
        if (code === '0x') {
          throw new Error(`No contract found at address: ${contractAddress}`);
        }
        
        this.fastify.log.info(`Contrat trouvé à l'adresse: ${contractAddress}`);
      }

      // Initialiser le contrat avec ABI -> ABI = Application Binary Interface
      // En gros, c'est un fichier qui décrit les fonctions et les événements du contrat
      this.contract = new ethers.Contract(contractAddress, this.contractABI, this.wallet);
      if (!this.contract) {
        throw new Error('Failed to initialize blockchain - contract not found');
      }
      this.fastify.log.info('Service blockchain initialisé avec succès');
      
    } catch (error) {
      this.fastify.log.error('Échec de l\'initialisation du service blockchain:', error);
      // Ne pas faire planter l'application, juste désactiver la blockchain
      this.fastify.log.warn('Les fonctionnalités blockchain seront désactivées');
    }
  }

  /**
   * Nettoyage lors de la fermeture
   */
  async cleanup(): Promise<void> {
    if (this.hardhatProcess) {
      this.fastify.log.info('Stopping local blockchain network...');
      this.hardhatProcess.kill('SIGTERM');
      this.hardhatProcess = null;
    }
  }

  /**
   * Enregistre un match sur la blockchain de manière ASYNCHRONE
   * Retourne immédiatement, l'enregistrement se fait en arrière-plan
   */
  async recordMatchOnBlockchain(matchData: MatchData): Promise<string | null> {
    if (!this.isAvailable()) {
      this.fastify.log.warn('Blockchain service not available, skipping blockchain recording');
      return null;
    }

    try {
      this.fastify.log.info(`Attempting to record match ${matchData.id} on blockchain`);

      // Vérifier si le match est déjà enregistré avec les mêmes données
      const isAlreadyRecorded = await this.isMatchDataAlreadyRecorded(matchData);

      if (isAlreadyRecorded) {
        this.fastify.log.info(`Match ${matchData.id} already recorded on blockchain with same data`);
        return 'already_recorded';
      }

      this.fastify.log.info(`Recording match ${matchData.id} for tournament ${matchData.tournament_id} on blockchain`);

      // ENREGISTREMENT ASYNCHRONE - Ne pas attendre la confirmation
      this.recordMatchAsync(matchData);

      // Retourner immédiatement un statut "pending"
      return 'pending';

    } catch (error) {
      this.fastify.log.error('Failed to record match on blockchain:', error);
      return null;
    }
  }

  /**
   * Vérifie si un match avec les mêmes données est déjà enregistré sur la blockchain
   */
  private async isMatchDataAlreadyRecorded(matchData: MatchData): Promise<boolean> {
    try {
      // Convertir l'UUID en ID blockchain
      const blockchainMatchId = this.uuidToBlockchainId(matchData.id);
      
      // Récupérer tous les matchs du tournoi depuis la blockchain
      const blockchainMatches = await this.contract!.getTournamentMatches(matchData.tournament_id);
      
      // Chercher un match avec les mêmes données
      const existingMatch = blockchainMatches.find((match: any) => 
        Number(match.matchId) === blockchainMatchId &&
        match.player1Name === matchData.player1_name &&
        match.player2Name === matchData.player2_name &&
        Number(match.player1Score) === matchData.player1_score &&
        Number(match.player2Score) === matchData.player2_score &&
        match.winnerName === matchData.winner_name
      );

      if (existingMatch) {
        this.fastify.log.info(`Match ${matchData.id} found on blockchain with matching data`);
        // Mettre à jour la base de données si ce n'est pas déjà fait
        await this.updateMatchWithBlockchainProof(matchData.id, 'existing_on_blockchain');
        return true;
      }

      // Vérifier si un match avec le même ID blockchain existe mais avec des données différentes
      const matchWithSameId = blockchainMatches.find((match: any) => 
        Number(match.matchId) === blockchainMatchId
      );

      if (matchWithSameId) {
        this.fastify.log.warn(`Match ${matchData.id} (blockchain ID: ${blockchainMatchId}) exists on blockchain but with different data:`, {
          blockchain: {
            player1: matchWithSameId.player1Name,
            player2: matchWithSameId.player2Name,
            winner: matchWithSameId.winnerName
          },
          current: {
            player1: matchData.player1_name,
            player2: matchData.player2_name,
            winner: matchData.winner_name
          }
        });
        // Dans ce cas, on va quand même essayer d'enregistrer (le contrat devrait rejeter)
      }

      return false;

    } catch (error) {
      this.fastify.log.error('Error checking if match data already recorded:', error);
      // En cas d'erreur, on essaie d'enregistrer quand même
      return false;
    }
  }

  /**
   * Enregistrement asynchrone en arrière-plan
   */
  private async recordMatchAsync(matchData: MatchData): Promise<void> {
    try {
      // Convertir l'UUID en ID blockchain
      const blockchainMatchId = this.uuidToBlockchainId(matchData.id);
      
      // Envoyer la transaction - Appel du Smart Contract - recordMatch()
      const tx = await this.contract!.recordMatch(
        matchData.tournament_id,
        blockchainMatchId,
        matchData.player1_name,
        matchData.player2_name,
        matchData.player1_score,
        matchData.player2_score,
        matchData.winner_name
      );

      this.fastify.log.info(`Transaction sent: ${tx.hash} (UUID: ${matchData.id} -> Blockchain ID: ${blockchainMatchId})`);

      // Attendre la confirmation en arrière-plan
      const receipt = await tx.wait();
      this.fastify.log.info(`Match recorded on blockchain. Block: ${receipt?.blockNumber}`);

      // Mettre à jour blockchain_verified et blockchain_tx_hash dans la DB
      await this.updateMatchWithBlockchainProof(matchData.id, tx.hash);

    } catch (error) {
      this.fastify.log.error(`Failed to record match ${matchData.id} on blockchain:`, error);
      // Optionnel : marquer le match comme "blockchain_failed" dans la DB
    }
  }

  /**
   * Met à jour le match avec la preuve blockchain - blockchain_verified et blockchain_tx_hash dans la DB
   */
  private async updateMatchWithBlockchainProof(matchId: string, txHash: string): Promise<void> {
    try {
      // Utiliser Sequelize pour mettre à jour
      const { MatchTournament } = this.fastify.db.models;
      
      const updateData: any = {
        blockchain_verified: true,
        blockchain_recorded_at: new Date()
      };

      // Si ce n'est pas un match existant, enregistrer le hash de transaction
      if (txHash !== 'existing_on_blockchain') {
        updateData.blockchain_tx_hash = txHash;
      }
      
      await MatchTournament.update(
        updateData,
        {
          where: { id: matchId }
        }
      );

      if (txHash === 'existing_on_blockchain') {
        this.fastify.log.info(`Match ${matchId} marked as verified (already existed on blockchain)`);
      } else {
        this.fastify.log.info(`Match ${matchId} recorded on blockchain: ${txHash}`);
        this.fastify.log.info(`Blockchain proof stored in database for match ${matchId}`);
      }

    } catch (error) {
      this.fastify.log.error(`Failed to update match ${matchId} with blockchain proof:`, error);
    }
  }

  /**
   * Récupère les matchs d'un tournoi depuis la blockchain
   */
  async getTournamentMatchesFromBlockchain(tournamentId: number): Promise<BlockchainMatchRecord[]> {
    if (!this.contract) {
      throw new Error('Blockchain not initialized');
    }

    try {
      const matches = await this.contract.getTournamentMatches(tournamentId);
      
      // Convertir les données blockchain en format utilisable
      return matches.map((match: any) => ({
        matchId: match.matchId,
        tournamentId: match.tournamentId,
        player1Name: match.player1Name,
        player2Name: match.player2Name,
        player1Score: match.player1Score,
        player2Score: match.player2Score,
        winnerName: match.winnerName,
        timestamp: match.timestamp,
        recordedBy: match.recordedBy
      }));

    } catch (error) {
      this.fastify.log.error('Failed to get tournament matches from blockchain:', error);
      throw error;
    }
  }

  /**
   * Vérifie si un match est enregistré sur la blockchain
   */
  async isMatchVerified(tournamentId: number, matchId: number): Promise<boolean> {
    if (!this.contract) {
      return false;
    }

    try {
      return await this.contract.isMatchRecorded(tournamentId, matchId);
    } catch (error) {
      this.fastify.log.error('Failed to verify match on blockchain:', error);
      return false;
    }
  }

  /**
   * Vérifie si la blockchain est disponible
   */
  isAvailable(): boolean {
    return this.contract !== null && this.wallet !== null;
  }

  /**
   * Récupère l'adresse du wallet
   */
  getWalletAddress(): string | null {
    return this.wallet?.address || null;
  }

  /**
   * Récupère le solde du wallet
   */
  async getBalance(): Promise<string> {
    if (!this.provider || !this.wallet) {
      throw new Error('Blockchain service not initialized');
    }
    
    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }

  /**
   * Récupère les informations du réseau
   */
  async getNetworkInfo(): Promise<{ name: string | null; chainId: bigint }> {
    if (!this.provider) {
      throw new Error('Blockchain service not initialized');
    }
    
    const network = await this.provider.getNetwork();
    return {
      name: network.name,
      chainId: network.chainId
    };
  }
} 