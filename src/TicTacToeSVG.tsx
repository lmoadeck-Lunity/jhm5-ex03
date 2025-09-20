import { useState } from 'react'

interface TicTacToeSVGProps {
  size: number;
}

export function TicTacToeSVG({ size }: TicTacToeSVGProps) {
  const [board, setBoard] = useState<string[][]>([
    ['', '', ''],
    ['', '', ''],
    ['', '', '']
  ]);
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [winningLine, setWinningLine] = useState<number[][] | null>(null);
  const [isSinglePlayer, setIsSinglePlayer] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);

  // Use the actual display size - no scaling
  const cellSize = size / 3;
  const padding = cellSize * 0.1;
  const lineWidth = 4; // Bolder lines

  const winningCombinations = [
    // Horizontal
    [[0, 0], [0, 1], [0, 2]],
    [[1, 0], [1, 1], [1, 2]],
    [[2, 0], [2, 1], [2, 2]],
    // Vertical
    [[0, 0], [1, 0], [2, 0]],
    [[0, 1], [1, 1], [2, 1]],
    [[0, 2], [1, 2], [2, 2]],
    // Diagonal
    [[0, 0], [1, 1], [2, 2]],
    [[0, 2], [1, 1], [2, 0]]
  ];

  const checkWinner = (newBoard: string[][]): { winner: string | null, combination: number[][] | null } => {
    for (const combination of winningCombinations) {
      const [a, b, c] = combination;
      if (newBoard[a[0]][a[1]] && 
          newBoard[a[0]][a[1]] === newBoard[b[0]][b[1]] && 
          newBoard[a[0]][a[1]] === newBoard[c[0]][c[1]]) {
        return { winner: newBoard[a[0]][a[1]], combination };
      }
    }
    // Check for draw
    const moves = newBoard.flat().filter(cell => cell !== '').length;
    return { winner: moves === 9 ? 'Draw' : null, combination: null };
  };

  // Minimax algorithm for AI
  const minimax = (board: string[][], depth: number, isMaximizing: boolean): number => {
    const result = checkWinner(board);
    
    if (result.winner === 'O') return 10 - depth; // AI wins
    if (result.winner === 'X') return depth - 10; // Human wins
    if (result.winner === 'Draw') return 0; // Draw
    
    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (board[i][j] === '') {
            board[i][j] = 'O';
            const score = minimax(board, depth + 1, false);
            board[i][j] = '';
            bestScore = Math.max(score, bestScore);
          }
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (board[i][j] === '') {
            board[i][j] = 'X';
            const score = minimax(board, depth + 1, true);
            board[i][j] = '';
            bestScore = Math.min(score, bestScore);
          }
        }
      }
      return bestScore;
    }
  };

  const getBestMove = (board: string[][]): { row: number, col: number } => {
    let bestScore = -Infinity;
    let bestMove = { row: 0, col: 0 };
    
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i][j] === '') {
          board[i][j] = 'O';
          const score = minimax(board, 0, false);
          board[i][j] = '';
          if (score > bestScore) {
            bestScore = score;
            bestMove = { row: i, col: j };
          }
        }
      }
    }
    return bestMove;
  };

  const makeAIMove = (currentBoard: string[][]) => {
    setIsAIThinking(true);
    
    // Add a small delay to make AI thinking visible
    setTimeout(() => {
      const bestMove = getBestMove(currentBoard);
      const newBoard = currentBoard.map(r => [...r]);
      newBoard[bestMove.row][bestMove.col] = 'O';
      setBoard(newBoard);
      setIsAIThinking(false);

      const gameResult = checkWinner(newBoard);
      if (gameResult.winner) {
        setGameOver(true);
        setWinner(gameResult.winner);
        if (gameResult.combination) {
          setWinningLine(gameResult.combination);
        }
        setTimeout(() => {
          alert(gameResult.winner === 'Draw' ? 'It\'s a draw!' : `${gameResult.winner} wins!`);
          resetGame();
        }, 1000);
      } else {
        setCurrentPlayer('X');
      }
    }, 500);
  };

  const handleClick = (row: number, col: number) => {
    if (gameOver || board[row][col] || isAIThinking) return;
    
    // In single player mode, only allow human (X) moves via click
    if (isSinglePlayer && currentPlayer === 'O') return;

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = currentPlayer;
    setBoard(newBoard);

    const gameResult = checkWinner(newBoard);
    if (gameResult.winner) {
      setGameOver(true);
      setWinner(gameResult.winner);
      if (gameResult.combination) {
        setWinningLine(gameResult.combination);
      }
      setTimeout(() => {
        alert(gameResult.winner === 'Draw' ? 'It\'s a draw!' : `${gameResult.winner} wins!`);
        resetGame();
      }, 1000);
    } else {
      if (isSinglePlayer && currentPlayer === 'X') {
        // Switch to AI turn
        setCurrentPlayer('O');
        makeAIMove(newBoard);
      } else {
        // Multiplayer mode or AI just moved
        setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
      }
    }
  };

  const resetGame = () => {
    setBoard([
      ['', '', ''],
      ['', '', ''],
      ['', '', '']
    ]);
    setCurrentPlayer('X');
    setGameOver(false);
    setWinner(null);
    setWinningLine(null);
    setIsAIThinking(false);
  };

  const toggleGameMode = () => {
    setIsSinglePlayer(!isSinglePlayer);
    resetGame();
  };

  const getCellCenter = (row: number, col: number) => {
    return {
      x: col * cellSize + cellSize / 2,
      y: row * cellSize + cellSize / 2
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
      {/* Game Mode Toggle */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px',
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '8px 16px',
        borderRadius: '20px',
        backdropFilter: 'blur(10px)'
      }}>
        <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
          {isSinglePlayer ? 'Single Player' : 'Multiplayer'}
        </span>
        <button
          onClick={toggleGameMode}
          style={{
            background: isSinglePlayer ? '#4CAF50' : '#2196F3',
            color: 'white',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '15px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Switch to {isSinglePlayer ? 'Multiplayer' : 'Single Player'}
        </button>
      </div>

      {/* Game Status */}
      <div style={{
        color: 'white',
        fontSize: '16px',
        fontWeight: '500',
        textAlign: 'center',
        minHeight: '20px'
      }}>
        {gameOver ? (
          winner === 'Draw' ? "It's a draw!" : `${winner} wins!`
        ) : isAIThinking ? (
          'AI is thinking...'
        ) : isSinglePlayer ? (
          currentPlayer === 'X' ? 'Your turn (X)' : 'AI turn (O)'
        ) : (
          `Player ${currentPlayer}'s turn`
        )}
      </div>

      {/* Game Board */}
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`}
        style={{ 
          background: '#f0f4f8',
          cursor: isAIThinking ? 'wait' : 'pointer',
          display: 'block'
        }}
      >
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="3" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Grid lines */}
      <g stroke="#a0aec0" strokeWidth={lineWidth} strokeLinecap="round">
        <line 
          x1={cellSize} y1={padding} 
          x2={cellSize} y2={size - padding} 
        />
        <line 
          x1={cellSize * 2} y1={padding} 
          x2={cellSize * 2} y2={size - padding} 
        />
        <line 
          x1={padding} y1={cellSize} 
          x2={size - padding} y2={cellSize} 
        />
        <line 
          x1={padding} y1={cellSize * 2} 
          x2={size - padding} y2={cellSize * 2} 
        />
      </g>

      {/* Clickable cells and game pieces */}
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const centerX = colIndex * cellSize + cellSize / 2;
          const centerY = rowIndex * cellSize + cellSize / 2;
          const pieceSize = cellSize * 0.3;
          const strokeWidth = 8; // Bolder strokes for pieces

          return (
            <g key={`${rowIndex}-${colIndex}`} onClick={() => handleClick(rowIndex, colIndex)}>
              {/* Invisible clickable area - now handled by g wrapper */}
              <rect
                x={colIndex * cellSize}
                y={rowIndex * cellSize}
                width={cellSize}
                height={cellSize}
                fill="transparent"
                style={{ cursor: gameOver || cell ? 'default' : 'pointer' }}
              />
              
              {/* Draw X */}
              {cell === 'X' && (
                <g filter="url(#shadow)" stroke="#e53e3e" strokeWidth={strokeWidth} strokeLinecap="round">
                  <line
                    x1={centerX - pieceSize}
                    y1={centerY - pieceSize}
                    x2={centerX + pieceSize}
                    y2={centerY + pieceSize}
                  />
                  <line
                    x1={centerX + pieceSize}
                    y1={centerY - pieceSize}
                    x2={centerX - pieceSize}
                    y2={centerY + pieceSize}
                  />
                </g>
              )}
              
              {/* Draw O */}
              {cell === 'O' && (
                <circle
                  cx={centerX}
                  cy={centerY}
                  r={pieceSize}
                  fill="none"
                  stroke="#3182ce"
                  strokeWidth={strokeWidth}
                  filter="url(#shadow)"
                />
              )}
            </g>
          );
        })
      )}

      {/* Winning Line */}
      {winningLine && (
        <line
          x1={getCellCenter(winningLine[0][0], winningLine[0][1]).x}
          y1={getCellCenter(winningLine[0][0], winningLine[0][1]).y}
          x2={getCellCenter(winningLine[2][0], winningLine[2][1]).x}
          y2={getCellCenter(winningLine[2][0], winningLine[2][1]).y}
          stroke="#2f3b4c"
          strokeWidth={10}
          strokeLinecap="round"
          filter="url(#shadow)"
        />
      )}
    </svg>
    </div>
  );
}
