import { Player } from '@/hooks/useMultiplayerGame';
import { Users } from 'lucide-react';

interface PlayerDashboardProps {
  players: Player[];
  currentPlayerId: string;
  roomCode: string;
}

export const PlayerDashboard = ({ players, currentPlayerId, roomCode }: PlayerDashboardProps) => {
  return (
    <div className="fixed top-4 right-4 z-30">
      <div className="glass-panel rounded-2xl p-3 sm:p-4 min-w-[140px] sm:min-w-[180px]">
        {/* Room Code */}
        <div className="text-center mb-3 pb-3 border-b border-border/30">
          <p className="text-foreground/50 text-[10px] uppercase tracking-wider mb-1">Room</p>
          <p className="text-foreground font-mono font-bold tracking-widest text-sm sm:text-base">{roomCode}</p>
        </div>

        {/* Players */}
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-3 h-3 text-foreground/50" />
          <p className="text-foreground/50 text-[10px] uppercase tracking-wider">Players</p>
        </div>
        
        <div className="space-y-2">
          {players.map((player) => (
            <div 
              key={player.id}
              className={`flex items-center justify-between gap-2 text-sm ${
                player.id === currentPlayerId ? 'text-foreground font-medium' : 'text-foreground'
              }`}
            >
              <span className="truncate max-w-[80px] sm:max-w-[100px]">
                {player.name}
                {player.id === currentPlayerId && ' (You)'}
              </span>
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                {player.wins}W
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
