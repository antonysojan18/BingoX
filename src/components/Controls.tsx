import { cn } from '@/lib/utils';

interface ControlsProps {
  mode: 'idle' | 'entering' | 'playing';
  entryIndex: number;
  onEnterNumbers: () => void;
  onGenerateCard: () => void;
  onReset: () => void;
}

export const Controls = ({
  mode,
  entryIndex,
  onEnterNumbers,
  onGenerateCard,
  onReset,
}: ControlsProps) => {
  return (
    <div className="flex flex-wrap justify-center gap-3 mt-6 sm:mt-8">
      {mode === 'idle' && (
        <>
          <button
            onClick={onEnterNumbers}
            className="control-btn primary"
          >
            Enter Numbers
          </button>
          <button
            onClick={onGenerateCard}
            className="control-btn"
          >
            Generate Card
          </button>
        </>
      )}

      {mode === 'entering' && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-foreground/80 text-sm sm:text-base">
            Tap tiles to enter numbers ({entryIndex}/25)
          </p>
          <button
            onClick={onReset}
            className="control-btn"
          >
            Cancel
          </button>
        </div>
      )}

      {mode === 'playing' && (
        <button
          onClick={onReset}
          className="control-btn"
        >
          Reset Board
        </button>
      )}
    </div>
  );
};
