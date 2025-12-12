import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Splash = () => {
  const navigate = useNavigate();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out after 2 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2000);

    // Navigate after fade completes
    const navTimer = setTimeout(() => {
      navigate('/lobby');
    }, 2800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(navTimer);
    };
  }, [navigate]);

  return (
    <div 
      className={`min-h-screen flex items-center justify-center transition-opacity duration-700 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="text-center animate-scale-in">
        <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-foreground tracking-tight">
          Bingo<span className="text-primary">X</span>
        </h1>
        <div className="mt-4 w-16 h-1 bg-primary/50 mx-auto rounded-full animate-pulse" />
      </div>
    </div>
  );
};

export default Splash;
