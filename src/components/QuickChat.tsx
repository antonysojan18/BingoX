import { useState, useEffect, useCallback } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Json } from '@/integrations/supabase/types';
import { useSound } from '@/hooks/useSound';

const QUICK_MESSAGES = [
  "Good luck everyone! 🍀",
  "Hiiiiii 👋😝",
  "Let's gooo! 🔥",
  "You Againnnn 😄😂",
  "You Are DEAD Mate 😏",
  "Lmao 😂",
  "Bruh 😭",
  "Check Mate 😮‍💨💥",
  "Close to Bingo 👀",
  "BIGGG BINGO!! 🎉🎉🔥",
];

interface ChatMessage {
  id: string;
  playerName: string;
  message: string;
  timestamp: number;
}

interface QuickChatProps {
  roomId: string;
  playerName: string;
}

export const QuickChat = ({ roomId, playerName }: QuickChatProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showToast, setShowToast] = useState<ChatMessage | null>(null);
  const { playPop } = useSound();

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from('rooms')
      .select('game_state')
      .eq('id', roomId)
      .maybeSingle();

    if (data?.game_state) {
      const gameState = data.game_state as { messages?: ChatMessage[] };
      const roomMessages = gameState.messages || [];
      setMessages(roomMessages);
    }
  }, [roomId]);

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`chat-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          const newState = payload.new.game_state as { messages?: ChatMessage[] };
          const newMessages = newState?.messages || [];
          
          // Show toast for new message
          if (newMessages.length > messages.length) {
            const latestMessage = newMessages[newMessages.length - 1];
            if (latestMessage.playerName !== playerName) {
              setShowToast(latestMessage);
              playPop();
              setTimeout(() => setShowToast(null), 3000);
            }
          }
          
          setMessages(newMessages);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, fetchMessages, playerName, messages.length]);

  const sendMessage = async (message: string) => {
    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      playerName,
      message,
      timestamp: Date.now(),
    };

    // Keep only last 10 messages
    const updatedMessages = [...messages, newMessage].slice(-10);

    const gameState: Json = { 
      messages: updatedMessages.map(m => ({
        id: m.id,
        playerName: m.playerName,
        message: m.message,
        timestamp: m.timestamp,
      }))
    };

    await supabase
      .from('rooms')
      .update({ game_state: gameState })
      .eq('id', roomId);

    setIsOpen(false);
  };

  return (
    <>
      {/* Toast notification for incoming messages */}
      {showToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl px-4 py-3 shadow-lg">
            <p className="text-xs text-primary font-medium">{showToast.playerName}</p>
            <p className="text-sm text-foreground">{showToast.message}</p>
          </div>
        </div>
      )}

      {/* Chat button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all z-30"
        aria-label="Quick chat"
      >
        <MessageCircle size={24} />
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed top-4 right-4 w-72 bg-card/95 backdrop-blur-sm border border-border rounded-xl shadow-xl z-30 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Quick Chat</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-muted transition-colors"
            >
              <X size={16} className="text-foreground/60" />
            </button>
          </div>

          {/* Recent messages */}
          {messages.length > 0 && (
            <div className="max-h-32 overflow-y-auto p-2 border-b border-border">
              {messages.slice(-5).map((msg) => (
                <div key={msg.id} className="py-1">
                  <span className="text-xs text-primary font-medium">{msg.playerName}: </span>
                  <span className="text-xs text-foreground/80">{msg.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Quick message buttons */}
          <div className="p-2 space-y-1.5">
            {QUICK_MESSAGES.map((msg) => (
              <button
                key={msg}
                onClick={() => sendMessage(msg)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm rounded-lg",
                  "bg-muted/50 hover:bg-muted text-foreground/90",
                  "transition-colors duration-150"
                )}
              >
                {msg}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
