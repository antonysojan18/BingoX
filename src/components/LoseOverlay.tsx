import { Home, RefreshCw } from 'lucide-react';

interface LoseOverlayProps {
  winnerName: string;
  onPlayAgain: () => void;
  onBackToHome: () => void;
}

export const LoseOverlay = ({ winnerName, onPlayAgain, onBackToHome }: LoseOverlayProps) => {
  return (
    <div 
      className="fixed inset-0 z-40 flex items-center justify-center bg-background/40 backdrop-blur-md"
    >
      <div className="text-center p-8 sm:p-12">
        {/* Better Luck Message */}
        <div className="animate-stamp-in mb-6">
          <div className="relative inline-block">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-foreground/90 tracking-wider">
              Better Luck
            </h1>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-foreground/90 tracking-wider">
              Next Time!
            </h1>
          </div>
        </div>

        {/* Winner info */}
        <p className="text-lg sm:text-xl md:text-2xl font-medium text-foreground/70 mb-8 animate-float">
          {winnerName} got BINGO! 🎉
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={onPlayAgain}
            className="control-btn primary text-lg px-8 py-4 flex items-center gap-2"
          >
            <RefreshCw size={20} />
            Play Again
          </button>
          
          <button
            onClick={onBackToHome}
            className="control-btn text-lg px-8 py-4 flex items-center gap-2"
          >
            <Home size={20} />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};
