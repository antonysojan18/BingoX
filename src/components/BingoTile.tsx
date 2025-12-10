import { cn } from '@/lib/utils';

interface BingoTileProps {
  value: number | null;
  marked: boolean;
  isCenter: boolean;
  isCompleted: boolean;
  mode: 'idle' | 'entering' | 'playing';
  onClick: () => void;
}

export const BingoTile = ({
  value,
  marked,
  isCenter,
  isCompleted,
  mode,
  onClick,
}: BingoTileProps) => {
  const isClickable = 
    (mode === 'entering' && !isCenter && value === null) ||
    (mode === 'playing' && !marked && !isCenter);

  return (
    <button
      onClick={onClick}
      disabled={!isClickable}
      className={cn(
        'glass-tile aspect-square rounded-xl flex items-center justify-center',
        'text-xl sm:text-2xl md:text-3xl font-bold',
        'select-none cursor-pointer',
        'transition-all duration-200 ease-out',
        marked && 'marked',
        isCompleted && 'completed',
        !isClickable && 'cursor-default',
        isCenter && 'bg-tile-marked/80',
      )}
    >
      {isCenter ? (
        <span className="text-base sm:text-lg md:text-xl font-semibold text-foreground/90">
          FREE
        </span>
      ) : (
        <span className={cn(
          'transition-all duration-200',
          marked ? 'text-foreground' : 'text-foreground/90',
          !value && mode === 'entering' && 'opacity-0',
        )}>
          {value || ''}
        </span>
      )}
    </button>
  );
};
