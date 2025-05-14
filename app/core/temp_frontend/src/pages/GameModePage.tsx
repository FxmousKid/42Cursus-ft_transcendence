import GameModeSelection from '@/components/GameModeSelection';

const GameModePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b2046] to-[#0056d3] text-foreground antialiased overflow-hidden relative">
      {/* Background effects */}
      <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-[#0056d3]/20 blur-3xl -z-10 animate-pulse-slow"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 rounded-full bg-[#0b2046]/40 blur-3xl -z-10 animate-pulse-slow animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-[#0073e6]/10 blur-3xl -z-10 animate-pulse-slow animation-delay-1000"></div>
      
      {/* Star-like dots */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="stars-container">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/70"
              style={{
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.5 + 0.3,
                animation: `pulse ${Math.random() * 3 + 2}s infinite alternate`
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Main content */}
      <main className="container mx-auto flex min-h-screen items-center justify-center pt-4">
        <GameModeSelection />
      </main>
      
      {/* Gradient overlay to enhance readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b2046]/70 to-transparent -z-5 pointer-events-none"></div>
    </div>
  );
};

export default GameModePage; 