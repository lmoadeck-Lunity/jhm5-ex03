import { useState, useLayoutEffect } from 'react'
import './App.css'
import { TicTacToeSVG } from './TicTacToeSVG'

function App() {
  const [size, setSize] = useState(300);

  useLayoutEffect(() => {
    const updateSize = () => {
      const maxSize = Math.min(window.innerWidth * 0.4, window.innerHeight * 0.4, 300);
      const newSize = Math.max(250, maxSize); // Larger for crisp SVG
      setSize(newSize);
    };

    window.addEventListener('resize', updateSize);
    updateSize(); // Initial size

    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (
    <div className="app">
      <h1 className="game-title">TIC TAC TOE</h1>
      <TicTacToeSVG size={size} />
      <div className="game-info">
        Click a square to play • First to get 3 in a row wins!
      </div>
    </div>
  )
}

export default App
