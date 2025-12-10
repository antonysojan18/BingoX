import { BingoTile } from './BingoTile';
import { TileState } from '@/hooks/useBingoGame';

interface BingoBoardProps {
  tiles: TileState[];
  mode: 'idle' | 'entering' | 'playing';
  completedTileIndices: Set<number>;
  onTileClick: (index: number) => void;
}

const HEADERS = ['B', 'I', 'N', 'G', 'O'];

export const BingoBoard = ({
  tiles,
  mode,
  completedTileIndices,
  onTileClick,
}: BingoBoardProps) => {
  return (
    <div className="glass-panel rounded-3xl p-4 sm:p-6 md:p-8 w-full max-w-[min(90vw,500px)]">
      {/* Header Row */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3 mb-3 sm:mb-4">
        {HEADERS.map((letter) => (
          <div
            key={letter}
            className="aspect-square flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-bold text-foreground/80"
          >
            {letter}
          </div>
        ))}
      </div>

      {/* Tile Grid */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {tiles.map((tile, index) => (
          <BingoTile
            key={index}
            value={tile.value}
            marked={tile.marked}
            isCenter={tile.isCenter}
            isCompleted={completedTileIndices.has(index)}
            mode={mode}
            onClick={() => onTileClick(index)}
          />
        ))}
      </div>
    </div>
  );
};
