import { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
}

const CONFETTI_COLORS = [
  'hsl(43, 96%, 56%)',  // Gold
  'hsl(38, 92%, 50%)',  // Amber
  'hsl(48, 96%, 53%)',  // Yellow gold
  'hsl(35, 91%, 45%)',  // Dark gold
  'hsl(45, 93%, 47%)',  // Bright gold
];

export const Confetti = () => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    const newPieces: ConfettiPiece[] = Array.from({ length: 200 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      size: 8 + Math.random() * 12,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    }));
    setPieces(newPieces);

    // Cleanup after animation
    const timer = setTimeout(() => {
      setPieces([]);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute animate-confetti"
          style={{
            left: `${piece.x}%`,
            top: '-20px',
            width: piece.size,
            height: piece.size * 0.6,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            borderRadius: '2px',
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
    </div>
  );
};
