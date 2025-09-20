export function ttc(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, displaySize: number) {
    //TicTacToe

    // Remove any existing click listeners to prevent double events
    const existingListeners = (canvas as any)._ttcClickHandler;
    if (existingListeners) {
        canvas.removeEventListener('click', existingListeners);
    }

    const cellSize = displaySize / 3; // Use display size for calculations
    const board: string[][] = [
        ['', '', ''],
        ['', '', ''],
        ['', '', '']
    ];
    let currentPlayer: 'X' | 'O' = 'X';
    let gameOver = false;
    let winner: string | null = null;
    let moves = 0;
    const winningCombinations: number[][][] = [
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
    
    function drawBoard(): void {
        // Create a subtle gradient background
        const gradient = ctx.createLinearGradient(0, 0, displaySize, displaySize);
        gradient.addColorStop(0, '#f8f9fa');
        gradient.addColorStop(1, '#e9ecef');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, displaySize, displaySize);
        
        // Add a subtle border around the entire board
        ctx.strokeStyle = '#495057';
        ctx.lineWidth = 3;
        ctx.strokeRect(1.5, 1.5, displaySize - 3, displaySize - 3);
        
        // Draw grid with enhanced styling
        ctx.strokeStyle = '#6c757d';
        const lineWidth = Math.max(2, Math.round(cellSize * 0.04));
        ctx.lineWidth = lineWidth;

        // Draw grid lines with pixel-perfect positioning
        for (let i = 1; i < 3; i++) {
            // Position lines at crisp pixel boundaries
            const pos = i * cellSize;
            const offset = (lineWidth % 2 === 0) ? 0 : 0.5; // center odd widths
            const linePos = Math.floor(pos) + offset;
            ctx.beginPath();
            ctx.moveTo(linePos, 0);
            ctx.lineTo(linePos, displaySize);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, linePos);
            ctx.lineTo(displaySize, linePos);
            ctx.stroke();
        }

        // Draw X and O with enhanced styling
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const cell = board[row][col];
                if (cell) {
                    const centerX = col * cellSize + cellSize / 2;
                    const centerY = row * cellSize + cellSize / 2;
                    
                    if (cell === 'X') {
                        // Draw stylized X with gradient and shadow
                        const gradient = ctx.createLinearGradient(centerX - cellSize/4, centerY - cellSize/4, centerX + cellSize/4, centerY + cellSize/4);
                        gradient.addColorStop(0, '#e74c3c');
                        gradient.addColorStop(1, '#c0392b');
                        
                        ctx.strokeStyle = gradient;
                        ctx.lineWidth = Math.max(4, cellSize * 0.08);
                        ctx.lineCap = 'round';
                        ctx.shadowColor = 'rgba(231, 76, 60, 0.3)';
                        ctx.shadowBlur = 8;
                        ctx.shadowOffsetX = 2;
                        ctx.shadowOffsetY = 2;
                        
                        const offset = cellSize * 0.25;
                        ctx.beginPath();
                        ctx.moveTo(centerX - offset, centerY - offset);
                        ctx.lineTo(centerX + offset, centerY + offset);
                        ctx.moveTo(centerX + offset, centerY - offset);
                        ctx.lineTo(centerX - offset, centerY + offset);
                        ctx.stroke();
                        
                    } else if (cell === 'O') {
                        // Draw stylized O with gradient and shadow
                        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, cellSize * 0.25);
                        gradient.addColorStop(0, '#3498db');
                        gradient.addColorStop(1, '#2980b9');
                        
                        ctx.strokeStyle = gradient;
                        ctx.lineWidth = Math.max(4, cellSize * 0.08);
                        ctx.shadowColor = 'rgba(52, 152, 219, 0.3)';
                        ctx.shadowBlur = 8;
                        ctx.shadowOffsetX = 2;
                        ctx.shadowOffsetY = 2;
                        
                        ctx.beginPath();
                        ctx.arc(centerX, centerY, cellSize * 0.25, 0, 2 * Math.PI);
                        ctx.stroke();
                    }
                    
                    // Reset shadow
                    ctx.shadowColor = 'transparent';
                    ctx.shadowBlur = 0;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                }
            }
        }
    }
    
    function checkWinner(): string | null {
        for (const combination of winningCombinations) {
            const [a, b, c] = combination;
            if (board[a[0]][a[1]] && board[a[0]][a[1]] === board[b[0]][b[1]] && board[a[0]][a[1]] === board[c[0]][c[1]]) {
                return board[a[0]][a[1]];
            }
        }
        return moves === 9 ? 'Draw' : null;
    }
    
    function handleClick(event: MouseEvent): void {
        if (gameOver) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);

        if (board[row] && board[row][col] !== undefined && (board[row][col] || row < 0 || row > 2 || col < 0 || col > 2)) return;

        board[row][col] = currentPlayer;
        moves++;
        winner = checkWinner();

        if (winner) {
            gameOver = true;
            // Use requestAnimationFrame instead of setTimeout for better timing
            requestAnimationFrame(() => {
                if (gameOver && winner) { // Double check to prevent duplicate alerts
                    alert(winner === 'Draw' ? 'It\'s a draw!' : `${winner} wins!`);
                    resetGame();
                }
            });
        } else {
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        }

        drawBoard();
    }
    
    function resetGame(): void {
        board.forEach(row => row.fill(''));
        currentPlayer = 'X';
        gameOver = false;
        winner = null;
        moves = 0;
        drawBoard();
    }
    
    // Store the event listener reference to prevent duplicates
    (canvas as any)._ttcClickHandler = handleClick;
    canvas.addEventListener('click', handleClick);
    
    drawBoard();
    
    return {
        resetGame,
        drawBoard,
        handleClick
    };
}

