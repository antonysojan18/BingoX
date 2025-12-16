import { Player } from '@/hooks/useMultiplayerGame';
import { Users } from 'lucide-react';

interface PlayerDashboardProps {
  players: Player[];
  currentPlayerId: string;
  roomCode: string;
}

export const PlayerDashboard = ({ players, currentPlayerId, roomCode }: PlayerDashboardProps) => {
  return (
    <div className="fixed top-2 left-2 sm:top-4 sm:left-4 z-30">
      <div className="glass-panel rounded-lg sm:rounded-2xl p-1.5 sm:p-4 min-w-[90px] sm:min-w-[180px]">
        {/* Room Code */}
        <div className="text-center mb-1 sm:mb-3 pb-1 sm:pb-3 border-b border-border/30">
          <p className="text-foreground/50 text-[6px] sm:text-[10px] uppercase tracking-wider mb-0.5">Room</p>
          <p className="text-foreground font-mono font-bold tracking-widest text-[10px] sm:text-base">{roomCode}</p>
        </div>

        {/* Players */}
        <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
          <Users className="w-2 h-2 sm:w-3 sm:h-3 text-foreground/50" />
          <p className="text-foreground/50 text-[6px] sm:text-[10px] uppercase tracking-wider">Players</p>
        </div>
        
        <div className="space-y-1 sm:space-y-2">
          {players.map((player) => (
            <div 
              key={player.id}
              className={`flex items-center justify-between gap-1 sm:gap-2 text-[10px] sm:text-sm ${
                player.id === currentPlayerId ? 'text-foreground font-medium' : 'text-foreground'
              }`}
            >
              <span className="truncate max-w-[50px] sm:max-w-[100px]">
                {player.name}
                {player.id === currentPlayerId && ' (You)'}
              </span>
              <span className="text-[8px] sm:text-xs bg-primary/20 text-primary px-1 sm:px-2 py-0.5 rounded-full">
                {player.wins}W
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
