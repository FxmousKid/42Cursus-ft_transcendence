import GameModeSelection from '@/components/GameModeSelection';

const GameModePage = () => {
  return (
    <div className="min-h-screen relative">
      {/* Background effects - simplified */}
      <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-primary-20 opacity-50"></div>
      
      {/* Main content */}
      <main className="simple-container simple-flex simple-flex-center min-h-screen">
        <GameModeSelection />
      </main>
    </div>
  );
};

export default GameModePage; 