// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title TournamentScores
 * @dev Smart contract pour stocker les scores de tournois de façon immutable
 * Basé sur la structure MatchTournament de votre backend
 */
contract TournamentScores {
    
    // Structure qui reflète votre modèle MatchTournament
    struct MatchRecord {
        uint256 matchId;           // ID du match depuis votre base SQLite
        uint256 tournamentId;      // tournament_id
        string player1Name;        // player1_name
        string player2Name;        // player2_name
        uint256 player1Score;      // player1_score
        uint256 player2Score;      // player2_score
        string winnerName;         // winner_name
        uint256 timestamp;         // Quand le match a été enregistré sur blockchain
        address recordedBy;        // Qui a enregistré (votre backend)
    }
    
    // Stockage : tournamentId => array de matchs - stocke tous les matchs d'un tournoi
    mapping(uint256 => MatchRecord[]) public tournamentMatches;
    
    // Vérification qu'un match spécifique existe
    mapping(uint256 => mapping(uint256 => bool)) public matchExists; // tournamentId => matchId => exists

    // Une fois un match enregistré, impossible de le modifier
    
    // Événements pour traçabilité
    event MatchRecorded(
        uint256 indexed tournamentId,
        uint256 indexed matchId,
        string player1Name,
        string player2Name,
        uint256 player1Score,
        uint256 player2Score,
        string winnerName,
        address recordedBy
    );
    
    // Seuls les adresses autorisées peuvent enregistrer (votre backend)
    mapping(address => bool) public authorizedRecorders;
    address public owner;
    
    constructor() {
        owner = msg.sender;
        authorizedRecorders[msg.sender] = true; // Le déployeur est autorisé
    }
    
    modifier onlyAuthorized() {
        require(authorizedRecorders[msg.sender], "Not authorized to record matches");
        _;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    /**
     * @dev Enregistre un match terminé sur la blockchain
     * Cette fonction sera appelée par votre backend après sauvegarde en SQLite
     */
    function recordMatch(
        uint256 _tournamentId,
        uint256 _matchId,
        string memory _player1Name,
        string memory _player2Name,
        uint256 _player1Score,
        uint256 _player2Score,
        string memory _winnerName
    ) external onlyAuthorized {
        
        // Vérifier qu'on n'enregistre pas deux fois le même match
        require(!matchExists[_tournamentId][_matchId], "Match already recorded");
        
        // Créer l'enregistrement
        MatchRecord memory newMatch = MatchRecord({
            matchId: _matchId,
            tournamentId: _tournamentId,
            player1Name: _player1Name,
            player2Name: _player2Name,
            player1Score: _player1Score,
            player2Score: _player2Score,
            winnerName: _winnerName,
            timestamp: block.timestamp,
            recordedBy: msg.sender
        });
        
        // Stocker de façon immutable avec le push()
        tournamentMatches[_tournamentId].push(newMatch);
        matchExists[_tournamentId][_matchId] = true;
        
        // Émettre l'événement pour la traçabilité
        emit MatchRecorded(
            _tournamentId,
            _matchId,
            _player1Name,
            _player2Name,
            _player1Score,
            _player2Score,
            _winnerName,
            msg.sender
        );
    }
    
    /**
     * @dev Récupère tous les matchs d'un tournoi
     */
    function getTournamentMatches(uint256 _tournamentId) 
        external 
        view 
        returns (MatchRecord[] memory) 
    {
        return tournamentMatches[_tournamentId];
    }
    
    /**
     * @dev Récupère le nombre de matchs dans un tournoi
     */
    function getTournamentMatchCount(uint256 _tournamentId) 
        external 
        view 
        returns (uint256) 
    {
        return tournamentMatches[_tournamentId].length;
    }
    
    /**
     * @dev Vérifie si un match spécifique a été enregistré
     */
    function isMatchRecorded(uint256 _tournamentId, uint256 _matchId) 
        external 
        view 
        returns (bool) 
    {
        return matchExists[_tournamentId][_matchId];
    }
    
    /**
     * @dev Ajoute une adresse autorisée à enregistrer des matchs
     * Utile pour autoriser votre backend
     */
    function addAuthorizedRecorder(address _recorder) external onlyOwner {
        authorizedRecorders[_recorder] = true;
    }
    
    /**
     * @dev Retire une autorisation
     */
    function removeAuthorizedRecorder(address _recorder) external onlyOwner {
        authorizedRecorders[_recorder] = false;
    }
} 