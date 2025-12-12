import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { BingoBoard } from '@/components/BingoBoard';
import { WinOverlay } from '@/components/WinOverlay';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PlayerDashboard } from '@/components/PlayerDashboard';
import { useMultiplayerGame } from '@/hooks/useMultiplayerGame';
import { useSound } from '@/hooks/useSound';

const MultiplayerGame = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { playerId, playerName, roomCode } = location.state || {};

  const {
    players,
    myTiles,
    mode,
    completedLines,
    completedTileIndices,
    hasWon,
    startGame,
    markTile,
    playAgain,
  } = useMultiplayerGame(roomId || '', playerId || '');

  const { playPop } = useSound();
  const [showWin, setShowWin] = useState(false);

  useEffect(() => {
    if (!roomId || !playerId) {
      navigate('/lobby');
    }
  }, [roomId, playerId, navigate]);

  useEffect(() => {
    if (hasWon && !showWin) {
      setShowWin(true);
    }
  }, [hasWon, showWin]);

  const handleTileClick = async (index: number) => {
    if (mode === 'playing') {
      const didMark = await markTile(index);
      if (didMark) {
        playPop();
      }
    }
  };

  const handleCloseWin = async () => {
    setShowWin(false);
    await playAgain();
  };

  const handleStartGame = () => {
    startGame();
  };

  if (!roomId || !playerId) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <ThemeToggle />
      <PlayerDashboard 
        players={players} 
        currentPlayerId={playerId} 
        roomCode={roomCode || ''} 
      />

      <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground mb-1 tracking-tight">
        Bingo<span className="text-primary">X</span>
      </h1>
      <p className="text-foreground text-xs sm:text-sm mb-6 sm:mb-8 tracking-wide">
        {playerName ? `Playing as ${playerName}` : 'Tap . Match . Celebrate'}
      </p>

      {/* Bingo Board */}
      <BingoBoard
        tiles={myTiles.length > 0 ? myTiles : Array(25).fill({ value: null, marked: false, isCenter: false })}
        mode={mode}
        entryIndex={25}
        completedTileIndices={completedTileIndices}
        completedLines={completedLines}
        onTileClick={handleTileClick}
      />

      {/* Start Button */}
      {mode === 'idle' && (
        <div className="mt-6">
          <button
            onClick={handleStartGame}
            className="control-btn primary px-8 py-3 text-base"
          >
            Generate Card & Start
          </button>
        </div>
      )}

      {/* Completed Lines Counter */}
      {mode === 'playing' && (
        <div className="mt-4 text-foreground/80 text-sm sm:text-base font-medium">
          Lines completed: <span className="text-primary">{completedLines.length}</span> / 5
        </div>
      )}

      {/* Win Overlay with Play Again */}
      {showWin && <WinOverlay onClose={handleCloseWin} />}

      {/* Footer */}
      <footer className="mt-auto pt-8 pb-4 text-center">
        <p className="text-foreground/30 text-[8px] font-medium tracking-widest uppercase">
          Made By Ayaton Studios
        </p>
      </footer>
    </div>
  );
};

export default MultiplayerGame;
