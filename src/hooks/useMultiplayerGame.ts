import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TileState } from './useBingoGame';
import { Json } from '@/integrations/supabase/types';

const WINNING_LINES = [
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],
  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
];

const generateRandomCard = (): TileState[] => {
  const numbers = Array.from({ length: 25 }, (_, i) => i + 1);
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  return numbers.map(num => ({
    value: num,
    marked: false,
    isCenter: false,
  }));
};

const parseTiles = (tiles: Json): TileState[] => {
  if (!Array.isArray(tiles)) return [];
  return tiles.map((t) => {
    const tile = t as { value?: number | null; marked?: boolean; isCenter?: boolean };
    return {
      value: tile.value ?? null,
      marked: tile.marked ?? false,
      isCenter: tile.isCenter ?? false,
    };
  });
};

const tilesToJson = (tiles: TileState[]): Json => {
  return tiles.map(t => ({
    value: t.value,
    marked: t.marked,
    isCenter: t.isCenter,
  })) as Json;
};

export interface Player {
  id: string;
  name: string;
  wins: number;
  tiles: TileState[];
}

export const useMultiplayerGame = (roomId: string, playerId: string) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [myTiles, setMyTiles] = useState<TileState[]>([]);
  const [completedLines, setCompletedLines] = useState<number[][]>([]);
  const [hasWon, setHasWon] = useState(false);
  const [mode, setMode] = useState<'idle' | 'entering' | 'playing'>('idle');
  const [entryIndex, setEntryIndex] = useState(1);
  const broadcastChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const checkCompletedLines = useCallback((tiles: TileState[]): number[][] => {
    return WINNING_LINES.filter(line => 
      line.every(index => tiles[index]?.marked)
    );
  }, []);

  // Mark a number on my board (used when receiving broadcast)
  const markNumberOnMyBoard = useCallback((markedNumber: number, fromPlayerId: string) => {
    if (fromPlayerId === playerId) return; // Don't process our own broadcasts
    
    setMyTiles(currentTiles => {
      if (currentTiles.length === 0) return currentTiles;
      
      const tileIndex = currentTiles.findIndex(t => t.value === markedNumber);
      if (tileIndex === -1 || currentTiles[tileIndex]?.marked) return currentTiles;
      
      const newTiles = [...currentTiles];
      newTiles[tileIndex] = { ...newTiles[tileIndex], marked: true };
      
      const lines = checkCompletedLines(newTiles);
      const won = lines.length >= 5;
      
      setCompletedLines(lines);
      setHasWon(won);
      
      // Update in database
      const updates: { tiles: Json; wins?: number } = { tiles: tilesToJson(newTiles) };
      if (won) {
        supabase
          .from('players')
          .select('wins')
          .eq('id', playerId)
          .single()
          .then(({ data }) => {
            if (data) {
              supabase
                .from('players')
                .update({ tiles: tilesToJson(newTiles), wins: (data.wins || 0) + 1 })
                .eq('id', playerId);
            }
          });
      } else {
        supabase
          .from('players')
          .update(updates)
          .eq('id', playerId);
      }
      
      return newTiles;
    });
  }, [playerId, checkCompletedLines]);

  // Fetch players
  const fetchPlayers = useCallback(async () => {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', roomId);

    if (error) {
      console.error('Error fetching players:', error);
      return;
    }

    const mappedPlayers: Player[] = data.map(p => ({
      id: p.id,
      name: p.name,
      wins: p.wins ?? 0,
      tiles: parseTiles(p.tiles ?? []),
    }));

    setPlayers(mappedPlayers);

    // Set my tiles
    const me = mappedPlayers.find(p => p.id === playerId);
    if (me && me.tiles.length > 0) {
      setMyTiles(me.tiles);
      // Check if all tiles have values to determine mode
      const allFilled = me.tiles.every(t => t.value !== null);
      if (allFilled) {
        setMode('playing');
        setEntryIndex(26);
      }
      // Check completed lines
      const lines = checkCompletedLines(me.tiles);
      setCompletedLines(lines);
      setHasWon(lines.length >= 5);
    }
  }, [roomId, playerId, checkCompletedLines]);

  // Subscribe to realtime updates
  useEffect(() => {
    fetchPlayers();

    // Channel for player database changes
    const dbChannel = supabase
      .channel(`room-db-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          fetchPlayers();
        }
      )
      .subscribe();

    // Broadcast channel for real-time number marking
    const broadcastChannel = supabase
      .channel(`room-broadcast-${roomId}`)
      .on('broadcast', { event: 'number_marked' }, (payload) => {
        const { markedNumber, fromPlayerId } = payload.payload as { markedNumber: number; fromPlayerId: string };
        markNumberOnMyBoard(markedNumber, fromPlayerId);
      })
      .subscribe();

    broadcastChannelRef.current = broadcastChannel;

    return () => {
      supabase.removeChannel(dbChannel);
      supabase.removeChannel(broadcastChannel);
    };
  }, [roomId, fetchPlayers, markNumberOnMyBoard]);

  const initializeEmptyTiles = (): TileState[] => {
    return Array(25).fill(null).map(() => ({
      value: null,
      marked: false,
      isCenter: false,
    }));
  };

  const startEnteringNumbers = useCallback(async () => {
    const emptyTiles = initializeEmptyTiles();
    setMyTiles(emptyTiles);
    setMode('entering');
    setEntryIndex(1);
    setCompletedLines([]);
    setHasWon(false);

    await supabase
      .from('players')
      .update({ tiles: tilesToJson(emptyTiles) })
      .eq('id', playerId);
  }, [playerId]);

  const enterNumber = useCallback(async (tileIndex: number): Promise<boolean> => {
    if (mode !== 'entering') return false;
    if (myTiles[tileIndex]?.value !== null) return false;
    if (entryIndex > 25) return false;

    const newTiles = [...myTiles];
    newTiles[tileIndex] = { ...newTiles[tileIndex], value: entryIndex, marked: false };
    
    const newEntryIndex = entryIndex + 1;
    setMyTiles(newTiles);
    setEntryIndex(newEntryIndex);

    // If all tiles filled, switch to playing mode
    if (newEntryIndex > 25) {
      setMode('playing');
    }

    await supabase
      .from('players')
      .update({ tiles: tilesToJson(newTiles) })
      .eq('id', playerId);

    return true;
  }, [mode, myTiles, entryIndex, playerId]);

  const generateCard = useCallback(async () => {
    const newTiles = generateRandomCard();
    setMyTiles(newTiles);
    setMode('playing');
    setEntryIndex(26);
    setCompletedLines([]);
    setHasWon(false);

    await supabase
      .from('players')
      .update({ tiles: tilesToJson(newTiles) })
      .eq('id', playerId);
  }, [playerId]);

  const startGame = useCallback(async () => {
    await generateCard();
  }, [generateCard]);

  const markTile = useCallback(async (tileIndex: number): Promise<boolean> => {
    if (mode !== 'playing') return false;
    if (myTiles[tileIndex]?.marked) return false;
    if (hasWon) return false;

    const markedNumber = myTiles[tileIndex]?.value;
    if (markedNumber === null || markedNumber === undefined) return false;

    const newTiles = [...myTiles];
    newTiles[tileIndex] = { ...newTiles[tileIndex], marked: true };
    
    const lines = checkCompletedLines(newTiles);
    const won = lines.length >= 5;

    setMyTiles(newTiles);
    setCompletedLines(lines);
    setHasWon(won);

    // Broadcast the marked number to all players in the room
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.send({
        type: 'broadcast',
        event: 'number_marked',
        payload: { markedNumber, fromPlayerId: playerId },
      });
    }

    // Update in database
    const updates: { tiles: Json; wins?: number } = { tiles: tilesToJson(newTiles) };
    
    if (won) {
      const me = players.find(p => p.id === playerId);
      if (me) {
        updates.wins = (me.wins || 0) + 1;
      }
    }

    await supabase
      .from('players')
      .update(updates)
      .eq('id', playerId);

    return true;
  }, [mode, myTiles, hasWon, playerId, players, checkCompletedLines]);

  const resetGame = useCallback(async () => {
    setMyTiles([]);
    setMode('idle');
    setEntryIndex(1);
    setCompletedLines([]);
    setHasWon(false);

    await supabase
      .from('players')
      .update({ tiles: tilesToJson([]) })
      .eq('id', playerId);
  }, [playerId]);

  const playAgain = useCallback(async () => {
    await resetGame();
  }, [resetGame]);

  const leaveRoom = useCallback(async () => {
    // Delete player from room
    await supabase
      .from('players')
      .delete()
      .eq('id', playerId);

    // Check if room is empty and delete if so
    const { data: remainingPlayers } = await supabase
      .from('players')
      .select('id')
      .eq('room_id', roomId);

    if (!remainingPlayers || remainingPlayers.length === 0) {
      await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId);
    }
  }, [playerId, roomId]);

  const completedTileIndices = new Set<number>();
  completedLines.forEach(line => {
    line.forEach(index => completedTileIndices.add(index));
  });

  return {
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
    startGame,
    markTile,
    resetGame,
    playAgain,
    leaveRoom,
  };
};
