import { useState, useCallback, useMemo } from 'react';

export interface TileState {
  value: number | null;
  marked: boolean;
  isCenter: boolean;
}

export interface GameState {
  tiles: TileState[];
  mode: 'idle' | 'entering' | 'playing';
  entryIndex: number;
  completedLines: number[][];
  hasWon: boolean;
}

const WINNING_LINES = [
  // Rows
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],
  // Columns
  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],
  // Diagonals
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
];

const createInitialTiles = (): TileState[] => {
  return Array.from({ length: 25 }, (_, i) => ({
    value: null,
    marked: i === 12, // Center is marked by default
    isCenter: i === 12,
  }));
};

const generateRandomCard = (): TileState[] => {
  // Generate numbers for each column (B: 1-15, I: 16-30, N: 31-45, G: 46-60, O: 61-75)
  const columns: number[][] = [];
  
  for (let col = 0; col < 5; col++) {
    const start = col * 15 + 1;
    const end = start + 14;
    const pool = Array.from({ length: 15 }, (_, i) => start + i);
    
    // Shuffle and take 5
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    columns.push(pool.slice(0, 5));
  }

  // Create tiles array in row order
  const tiles: TileState[] = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const index = row * 5 + col;
      const isCenter = index === 12;
      tiles.push({
        value: isCenter ? null : columns[col][row],
        marked: isCenter,
        isCenter,
      });
    }
  }

  return tiles;
};

export const useBingoGame = () => {
  const [gameState, setGameState] = useState<GameState>({
    tiles: createInitialTiles(),
    mode: 'idle',
    entryIndex: 0,
    completedLines: [],
    hasWon: false,
  });

  const checkCompletedLines = useCallback((tiles: TileState[]): number[][] => {
    return WINNING_LINES.filter(line => 
      line.every(index => tiles[index].marked)
    );
  }, []);

  const startEnteringNumbers = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      mode: 'entering',
      entryIndex: 0,
    }));
  }, []);

  const enterNumber = useCallback((tileIndex: number) => {
    if (gameState.mode !== 'entering') return;
    if (tileIndex === 12) return; // Skip center
    
    setGameState(prev => {
      const newTiles = [...prev.tiles];
      const currentNumber = prev.entryIndex + 1;
      
      // Skip if this tile already has a number
      if (newTiles[tileIndex].value !== null) return prev;
      
      newTiles[tileIndex] = {
        ...newTiles[tileIndex],
        value: currentNumber,
      };

      const newEntryIndex = prev.entryIndex + 1;
      const isComplete = newEntryIndex >= 24; // 24 numbers (excluding center)

      return {
        ...prev,
        tiles: newTiles,
        entryIndex: newEntryIndex,
        mode: isComplete ? 'playing' : 'entering',
      };
    });
  }, [gameState.mode]);

  const generateCard = useCallback(() => {
    setGameState({
      tiles: generateRandomCard(),
      mode: 'playing',
      entryIndex: 24,
      completedLines: [],
      hasWon: false,
    });
  }, []);

  const markTile = useCallback((tileIndex: number): boolean => {
    if (gameState.mode !== 'playing') return false;
    if (gameState.tiles[tileIndex].marked) return false;
    if (gameState.tiles[tileIndex].isCenter) return false;
    if (gameState.hasWon) return false;

    let didMark = false;

    setGameState(prev => {
      const newTiles = [...prev.tiles];
      newTiles[tileIndex] = {
        ...newTiles[tileIndex],
        marked: true,
      };

      const completedLines = checkCompletedLines(newTiles);
      const hasWon = completedLines.length >= 5;

      didMark = true;

      return {
        ...prev,
        tiles: newTiles,
        completedLines,
        hasWon,
      };
    });

    return didMark;
  }, [gameState.mode, gameState.tiles, gameState.hasWon, checkCompletedLines]);

  const resetGame = useCallback(() => {
    setGameState({
      tiles: createInitialTiles(),
      mode: 'idle',
      entryIndex: 0,
      completedLines: [],
      hasWon: false,
    });
  }, []);

  const completedTileIndices = useMemo(() => {
    const indices = new Set<number>();
    gameState.completedLines.forEach(line => {
      line.forEach(index => indices.add(index));
    });
    return indices;
  }, [gameState.completedLines]);

  return {
    ...gameState,
    completedTileIndices,
    startEnteringNumbers,
    enterNumber,
    generateCard,
    markTile,
    resetGame,
  };
};
