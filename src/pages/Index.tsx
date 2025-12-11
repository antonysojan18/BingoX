import { useEffect, useState } from 'react';
import { BingoBoard } from '@/components/BingoBoard';
import { Controls } from '@/components/Controls';
import { WinOverlay } from '@/components/WinOverlay';
import { useBingoGame } from '@/hooks/useBingoGame';
import { useSound } from '@/hooks/useSound';

const Index = () => {
  const {
    tiles,
    mode,
    entryIndex,
    completedTileIndices,
    completedLines,
    hasWon,
    startEnteringNumbers,
    enterNumber,
    generateCard,
    markTile,
    resetGame,
  } = useBingoGame();

  const { playPop } = useSound();
  const [showWin, setShowWin] = useState(false);

  useEffect(() => {
    if (hasWon && !showWin) {
      setShowWin(true);
    }
  }, [hasWon, showWin]);

  const handleTileClick = (index: number) => {
    if (mode === 'entering') {
      const success = enterNumber(index);
      if (tiles[index].value === null && index !== 12) {
        playPop();
      }
    } else if (mode === 'playing') {
      const didMark = markTile(index);
      if (didMark) {
        playPop();
      }
    }
  };

  const handleCloseWin = () => {
    setShowWin(false);
    resetGame();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Title */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground mb-2 tracking-tight">
        Bingo<span className="text-primary">X</span>
      </h1>
      <p className="text-foreground/60 text-sm sm:text-base mb-6 sm:mb-8">
        {mode === 'idle' && 'Choose how to set up your card'}
        {mode === 'entering' && `Tap tiles in order to enter your numbers (${entryIndex}/25)`}
        {mode === 'playing' && 'Mark your numbers • 5 lines to win'}
      </p>

      {/* Bingo Board */}
      <BingoBoard
        tiles={tiles}
        mode={mode}
        completedTileIndices={completedTileIndices}
        completedLines={completedLines}
        onTileClick={handleTileClick}
      />

      {/* Controls */}
      <Controls
        mode={mode}
        entryIndex={entryIndex}
        onEnterNumbers={startEnteringNumbers}
        onGenerateCard={generateCard}
        onReset={resetGame}
      />

      {/* Completed Lines Counter */}
      {mode === 'playing' && (
        <div className="mt-4 text-foreground/80 text-sm sm:text-base font-medium">
          Lines completed: <span className="text-primary">{completedLines.length}</span> / 5
        </div>
      )}

      {/* Win Overlay */}
      {showWin && <WinOverlay onClose={handleCloseWin} />}

      {/* Footer */}
      <footer className="mt-auto pt-8 pb-4 text-center">
        <p className="text-foreground/40 text-xs sm:text-sm font-medium tracking-widest uppercase">
          AYATON STUDIOS
        </p>
      </footer>
    </div>
  );
};

export default Index;
