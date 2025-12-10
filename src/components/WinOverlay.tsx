import { useEffect } from 'react';
import { Confetti } from './Confetti';
import { useSound } from '@/hooks/useSound';

interface WinOverlayProps {
  onClose: () => void;
}

export const WinOverlay = ({ onClose }: WinOverlayProps) => {
  const { playWin } = useSound();

  useEffect(() => {
    playWin();
  }, [playWin]);

  return (
    <>
      <Confetti />
      <div 
        className="fixed inset-0 z-40 flex items-center justify-center bg-background/40 backdrop-blur-md"
        onClick={onClose}
      >
        <div className="text-center p-8 sm:p-12">
          {/* BINGO Stamp */}
          <div className="animate-stamp-in mb-6">
            <div className="relative inline-block">
              <h1 className="text-6xl sm:text-8xl md:text-9xl font-black text-foreground text-shadow-glow tracking-wider">
                BINGO!
              </h1>
              <div className="absolute inset-0 bg-primary/20 blur-3xl -z-10 animate-pulse-glow" />
            </div>
          </div>

          {/* Subtitle */}
          <p className="text-xl sm:text-2xl md:text-3xl font-medium text-foreground/90 mb-8 animate-float">
            🎉 Congratulations! 🎉
          </p>

          {/* Play Again Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="control-btn primary text-lg px-8 py-4 animate-pulse-glow"
          >
            Play Again
          </button>

          <p className="text-sm text-foreground/60 mt-6">
            Tap anywhere to continue
          </p>
        </div>
      </div>
    </>
  );
};
