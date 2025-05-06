import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PongGame from '../components/PongGame';

const GamePage: React.FC = () => {
  const navigate = useNavigate();
  const [gameMode, setGameMode] = useState<'local' | 'ai' | 'online'>('local');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [gameStarted, setGameStarted] = useState(false);

  // Démarrer le jeu avec les paramètres sélectionnés
  const startGame = () => {
    setGameStarted(true);
  };

  // Retour à la sélection du mode
  const backToSelection = () => {
    setGameStarted(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <button 
            className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            onClick={() => navigate('/')}
          >
            Retour
          </button>
          <h1 className="text-3xl font-bold text-center">Pong</h1>
          <div className="w-24"></div> {/* Espace pour équilibrer le header */}
        </header>

        {/* Contenu principal */}
        {!gameStarted ? (
          // Écran de sélection du mode de jeu
          <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-2xl font-bold mb-6 text-center">Sélectionner un mode de jeu</h2>
            
            {/* Sélection du mode */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <button
                className={`p-4 rounded-lg text-center transition-colors ${
                  gameMode === 'local' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                onClick={() => setGameMode('local')}
              >
                <h3 className="text-xl font-bold mb-2">Local</h3>
                <p className="text-sm text-gray-300">Jouez à deux sur le même clavier</p>
              </button>
              
              <button
                className={`p-4 rounded-lg text-center transition-colors ${
                  gameMode === 'ai' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                onClick={() => setGameMode('ai')}
              >
                <h3 className="text-xl font-bold mb-2">Contre l'IA</h3>
                <p className="text-sm text-gray-300">Affrontez l'ordinateur</p>
              </button>
              
              <button
                className={`p-4 rounded-lg text-center transition-colors ${
                  gameMode === 'online' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                onClick={() => setGameMode('online')}
              >
                <h3 className="text-xl font-bold mb-2">En ligne</h3>
                <p className="text-sm text-gray-300">Jouez contre d'autres joueurs</p>
              </button>
            </div>
            
            {/* Sélection de la difficulté (uniquement en mode IA) */}
            {gameMode === 'ai' && (
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4">Difficulté</h3>
                <div className="flex justify-center gap-4">
                  {['easy', 'medium', 'hard'].map((level) => (
                    <button
                      key={level}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        difficulty === level ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                      onClick={() => setDifficulty(level as 'easy' | 'medium' | 'hard')}
                    >
                      {level === 'easy' ? 'Facile' : level === 'medium' ? 'Moyen' : 'Difficile'}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Bouton pour démarrer */}
            <div className="text-center mt-8">
              <button
                className="px-8 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-xl transition-colors"
                onClick={startGame}
              >
                Jouer
              </button>
            </div>
          </div>
        ) : (
          // Écran du jeu
          <div>
            <div className="bg-gray-800 rounded-lg p-4 shadow-xl mb-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  Mode: {gameMode === 'local' ? 'Local' : gameMode === 'ai' ? 'IA' : 'En ligne'}
                  {gameMode === 'ai' && ` (${difficulty === 'easy' ? 'Facile' : difficulty === 'medium' ? 'Moyen' : 'Difficile'})`}
                </h2>
                <button 
                  className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                  onClick={backToSelection}
                >
                  Changer de mode
                </button>
              </div>
              
              <PongGame mode={gameMode} difficulty={difficulty} />
            </div>
            
            {/* Instructions */}
            <div className="bg-gray-800 rounded-lg p-4 mt-4 text-gray-300 text-sm">
              <h3 className="font-bold text-white mb-2">Instructions</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Le premier joueur à atteindre 10 points gagne la partie</li>
                <li>Mode local: Joueur 1 utilise W/S, Joueur 2 utilise les flèches haut/bas</li>
                <li>Mode IA: Utilisez W/S ou les flèches haut/bas pour déplacer votre raquette</li>
                <li>Appuyez sur R pour réinitialiser la partie à tout moment</li>
              </ul>
            </div>
          </div>
        )}
        
        {/* Footer */}
        <footer className="mt-8 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} 42 Transcendence - Pong Game</p>
        </footer>
      </div>
    </div>
  );
};

export default GamePage;
