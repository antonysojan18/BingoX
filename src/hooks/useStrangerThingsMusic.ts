import { useState, useRef, useCallback, useEffect } from 'react';

const MUSIC_CACHE_KEY = 'bingox-stranger-things-music';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const useStrangerThingsMusic = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const fetchMusic = useCallback(async (): Promise<string | null> => {
    // Check cache first
    const cached = localStorage.getItem(MUSIC_CACHE_KEY);
    if (cached) {
      console.log('Using cached music');
      return cached;
    }

    setIsLoading(true);
    try {
      console.log('Generating Stranger Things-style music...');
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/elevenlabs-music`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            prompt: 'Dark synth wave music in the style of the Stranger Things TV show theme. Ethereal synth pads, pulsing bass, arpeggiator melody, 80s retro electronic sound, mysterious and atmospheric, cinematic ambient',
            duration: 90,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to generate music: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const base64 = await blobToBase64(audioBlob);
      
      // Cache the music
      localStorage.setItem(MUSIC_CACHE_KEY, base64);
      console.log('Music generated and cached');
      
      return base64;
    } catch (error) {
      console.error('Error fetching music:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const start = useCallback(async () => {
    if (audioRef.current && !audioRef.current.paused) return;

    // If we already have the audio loaded, just play it
    if (audioRef.current && audioUrlRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    const musicUrl = await fetchMusic();
    if (!musicUrl) {
      console.error('Failed to get music');
      return;
    }

    audioUrlRef.current = musicUrl;
    const audio = new Audio(musicUrl);
    audio.loop = true;
    audio.volume = 0.3;
    audioRef.current = audio;

    audio.onended = () => {
      // Loop will handle this, but just in case
      setIsPlaying(false);
    };

    audio.onerror = (e) => {
      console.error('Audio playback error:', e);
      setIsPlaying(false);
    };

    try {
      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  }, [fetchMusic]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      start();
    }
  }, [isPlaying, start, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return { isPlaying, isLoading, start, stop, toggle };
};
