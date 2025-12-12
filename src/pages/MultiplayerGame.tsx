import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BingoBoard } from '@/components/BingoBoard';
import { WinOverlay } from '@/components/WinOverlay';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PlayerDashboard } from '@/components/PlayerDashboard';
import { QuickChat } from '@/components/QuickChat';
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
    entryIndex,
    completedLines,
    completedTileIndices,
    hasWon,
    startEnteringNumbers,
    enterNumber,
    generateCard,
    markTile,
    playAgain,
    leaveRoom,
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
    if (mode === 'entering') {
      const success = await enterNumber(index);
      if (success) {
        playPop();
      }
    } else if (mode === 'playing') {
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

  const handleBackToHome = async () => {
    await leaveRoom();
    navigate('/');
  };

  const handleBack = async () => {
    await leaveRoom();
    navigate('/lobby');
  };

  if (!roomId || !playerId) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <ThemeToggle />
      
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="fixed top-4 left-4 p-2 rounded-full bg-card/50 backdrop-blur-sm border border-border/50 text-foreground/70 hover:text-foreground hover:bg-card/80 transition-all z-20"
        aria-label="Back to lobby"
      >
        <ArrowLeft size={20} />
      </button>

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
        entryIndex={entryIndex}
        completedTileIndices={completedTileIndices}
        completedLines={completedLines}
        onTileClick={handleTileClick}
      />

      {/* Controls */}
      <div className="flex flex-wrap justify-center gap-3 mt-6 sm:mt-8">
        {mode === 'idle' && (
          <>
            <button
              onClick={startEnteringNumbers}
              className="control-btn primary"
            >
              Enter Numbers
            </button>
            <button
              onClick={generateCard}
              className="control-btn"
            >
              Generate Card
            </button>
          </>
        )}

        {mode === 'entering' && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-foreground/80 text-sm sm:text-base">
              Tap tiles to enter numbers ({entryIndex - 1}/25)
            </p>
          </div>
        )}
      </div>

      {/* Completed Lines Counter */}
      {mode === 'playing' && (
        <div className="mt-4 text-foreground/80 text-sm sm:text-base font-medium">
          Lines completed: <span className="text-primary">{completedLines.length}</span> / 5
        </div>
      )}

      {/* Quick Chat */}
      <QuickChat roomId={roomId} playerName={playerName || 'Player'} />

      {/* Win Overlay with Play Again and Back to Home */}
      {showWin && <WinOverlay onClose={handleCloseWin} onBackToHome={handleBackToHome} />}

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
