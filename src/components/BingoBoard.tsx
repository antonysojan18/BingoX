import { BingoTile } from './BingoTile';
import { TileState } from '@/hooks/useBingoGame';
import { cn } from '@/lib/utils';

interface BingoBoardProps {
  tiles: TileState[];
  mode: 'idle' | 'entering' | 'playing';
  entryIndex: number;
  completedTileIndices: Set<number>;
  completedLines: number[][];
  onTileClick: (index: number) => void;
}

const HEADERS = ['B', 'I', 'N', 'G', 'O'];

// Line definitions for drawing strike-through
const LINE_COORDINATES: Record<string, { x1: number; y1: number; x2: number; y2: number }> = {
  // Rows (0-4)
  '0,1,2,3,4': { x1: 5, y1: 10, x2: 95, y2: 10 },
  '5,6,7,8,9': { x1: 5, y1: 30, x2: 95, y2: 30 },
  '10,11,12,13,14': { x1: 5, y1: 50, x2: 95, y2: 50 },
  '15,16,17,18,19': { x1: 5, y1: 70, x2: 95, y2: 70 },
  '20,21,22,23,24': { x1: 5, y1: 90, x2: 95, y2: 90 },
  // Columns (0-4)
  '0,5,10,15,20': { x1: 10, y1: 5, x2: 10, y2: 95 },
  '1,6,11,16,21': { x1: 30, y1: 5, x2: 30, y2: 95 },
  '2,7,12,17,22': { x1: 50, y1: 5, x2: 50, y2: 95 },
  '3,8,13,18,23': { x1: 70, y1: 5, x2: 70, y2: 95 },
  '4,9,14,19,24': { x1: 90, y1: 5, x2: 90, y2: 95 },
  // Diagonals
  '0,6,12,18,24': { x1: 5, y1: 5, x2: 95, y2: 95 },
  '4,8,12,16,20': { x1: 95, y1: 5, x2: 5, y2: 95 },
};

export const BingoBoard = ({
  tiles,
  mode,
  entryIndex,
  completedTileIndices,
  completedLines,
  onTileClick,
}: BingoBoardProps) => {
  const illuminatedCount = Math.min(completedLines.length, 5);

  const instructionText = mode === 'idle' 
    ? 'Choose how to set up your card'
    : mode === 'entering' 
    ? `Tap tiles in order to enter your numbers (${entryIndex}/25)`
    : 'Mark your numbers • 5 lines to win';

  return (
    <div className="glass-panel rounded-3xl p-4 sm:p-6 md:p-8 w-full max-w-[min(90vw,500px)]">
      {/* Instruction Text */}
      <p className="text-foreground/60 text-xs sm:text-sm text-center mb-3 sm:mb-4">
        {instructionText}
      </p>

      {/* Header Row - BINGO letters */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3 mb-3 sm:mb-4">
        {HEADERS.map((letter, index) => (
          <div
            key={letter}
            className={cn(
              'bingo-letter aspect-square flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-bold',
              index < illuminatedCount && 'illuminated'
            )}
          >
            {letter}
          </div>
        ))}
      </div>

      {/* Tile Grid with Strike Lines */}
      <div className="relative">
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

        {/* SVG Strike Lines Overlay */}
        {completedLines.length > 0 && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {completedLines.map((line, index) => {
              const lineKey = line.join(',');
              const coords = LINE_COORDINATES[lineKey];
              if (!coords) return null;
              
              return (
                <line
                  key={index}
                  x1={coords.x1}
                  y1={coords.y1}
                  x2={coords.x2}
                  y2={coords.y2}
                  className="strike-line"
                  style={{ animationDelay: `${index * 0.1}s` }}
                />
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
};
