import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useStrangerThingsMusic } from '@/hooks/useStrangerThingsMusic';
import { useSound } from '@/hooks/useSound';
import { Volume2, VolumeX } from 'lucide-react';

const generateRoomCode = () => {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
};

const Lobby = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const { isPlaying, toggle, stop } = useStrangerThingsMusic();
  const { playRoomEnter } = useSound();

  // Stop music when leaving lobby
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      toast({
        title: 'Enter your name',
        description: 'Please enter your player name to continue',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    const code = generateRoomCode();

    try {
      // Create room
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert({ code })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add player
      const { data: player, error: playerError } = await supabase
        .from('players')
        .insert({ room_id: room.id, name: playerName.trim() })
        .select()
        .single();

      if (playerError) throw playerError;

      // Stop music and play room enter sound
      stop();
      playRoomEnter();
      
      // Navigate to game
      navigate(`/game/${room.id}`, { 
        state: { playerId: player.id, playerName: playerName.trim(), roomCode: code } 
      });
    } catch (error) {
      console.error('Error creating room:', error);
      toast({
        title: 'Error',
        description: 'Failed to create room. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      toast({
        title: 'Enter your name',
        description: 'Please enter your player name to continue',
        variant: 'destructive',
      });
      return;
    }

    if (!roomCode.trim()) {
      toast({
        title: 'Enter room code',
        description: 'Please enter the room code to join',
        variant: 'destructive',
      });
      return;
    }

    setIsJoining(true);

    try {
      // Find room
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select()
        .eq('code', roomCode.trim())
        .eq('is_active', true)
        .single();

      if (roomError || !room) {
        toast({
          title: 'Room not found',
          description: 'Please check the room code and try again',
          variant: 'destructive',
        });
        setIsJoining(false);
        return;
      }

      // Add player
      const { data: player, error: playerError } = await supabase
        .from('players')
        .insert({ room_id: room.id, name: playerName.trim() })
        .select()
        .single();

      if (playerError) throw playerError;

      // Stop music and play room enter sound
      stop();
      playRoomEnter();
      
      // Navigate to game
      navigate(`/game/${room.id}`, { 
        state: { playerId: player.id, playerName: playerName.trim(), roomCode: room.code } 
      });
    } catch (error) {
      console.error('Error joining room:', error);
      toast({
        title: 'Error',
        description: 'Failed to join room. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handlePlaySolo = () => {
    navigate('/solo');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="fixed top-4 right-4 flex items-center gap-2 z-50">
        <button
          onClick={toggle}
          className={`p-2.5 rounded-full glass-panel transition-all duration-300 hover:scale-105 ${
            isPlaying ? 'text-primary animate-pulse-glow' : 'text-foreground/60'
          }`}
          aria-label={isPlaying ? 'Mute music' : 'Play music'}
        >
          {isPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
        <ThemeToggle />
      </div>
      
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground mb-1 tracking-tight">
        Bingo<span className="text-primary">X</span>
      </h1>
      <p className="text-foreground text-xs sm:text-sm mb-8 tracking-wide">
        Tap . Match . Celebrate
      </p>

      <div className="glass-panel rounded-3xl p-6 sm:p-8 w-full max-w-md">
        {/* Player Name Input */}
        <div className="mb-6">
          <label className="block text-foreground/80 text-sm font-medium mb-2">
            Your Name
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
            className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border/50 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        {/* Create Room */}
        <button
          onClick={handleCreateRoom}
          disabled={isCreating}
          className="w-full control-btn primary mb-4 py-3 text-base disabled:opacity-50"
        >
          {isCreating ? 'Creating...' : 'Create Room'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-border/50" />
          <span className="text-foreground/50 text-sm">or</span>
          <div className="flex-1 h-px bg-border/50" />
        </div>

        {/* Join Room */}
        <div className="mb-4">
          <label className="block text-foreground/80 text-sm font-medium mb-2">
            Room Code
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter 6-digit code"
            maxLength={6}
            className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border/50 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-center tracking-widest text-lg font-mono"
          />
        </div>

        <button
          onClick={handleJoinRoom}
          disabled={isJoining}
          className="w-full control-btn secondary py-3 text-base disabled:opacity-50"
        >
          {isJoining ? 'Joining...' : 'Join Room'}
        </button>

        {/* Solo Play */}
        <div className="mt-6 pt-6 border-t border-border/30">
          <button
            onClick={handlePlaySolo}
            className="w-full text-foreground/60 hover:text-foreground text-sm transition-colors"
          >
            Play Solo →
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto pt-8 pb-4 text-center">
        <p className="text-foreground/30 text-[8px] font-medium tracking-widest uppercase">
          Made By Ayaton Studios
        </p>
      </footer>
    </div>
  );
};

export default Lobby;
