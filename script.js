// Configurações do jogo
const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
const nextPieceCanvas = document.getElementById('next-piece-canvas');
const nextPieceCtx = nextPieceCanvas.getContext('2d');

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 30;

// Cores das peças
const COLORS = [
    null,
    '#FF0D72',
    '#0DC2FF',
    '#0DFF72',
    '#F538FF',
    '#FF8E0D',
    '#FFE138',
    '#3877FF'
];

// Formatos das peças
const PIECES = [
    null,
    { 
        shape: [
            [0,0,0,0],
            [1,1,1,1],
            [0,0,0,0],
            [0,0,0,0]
        ], color: 1
    },
    {
        shape: [
            [2,0,0],
            [2,2,2],
            [0,0,0]
        ], color: 2
    },
    {
        shape: [
            [0,0,3],
            [3,3,3],
            [0,0,0]
        ], color: 3
    },
    {
        shape: [
            [4,4],
            [4,4]
        ], color: 4
    },
    {
        shape: [
            [0,5,5],
            [5,5,0],
            [0,0,0]
        ], color: 5
    },
    {
        shape: [
            [0,6,0],
            [6,6,6],
            [0,0,0]
        ], color: 6
    },
    {
        shape: [
            [7,7,0],
            [0,7,7],
            [0,0,0]
        ], color: 7
    }
];

// Estado do jogo
let board = createBoard();
let score = 0;
let lines = 0;
let level = 1;
let gameOver = false;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

// Peça atual e próxima peça
let player = {
    pos: {x: 0, y: 0},
    piece: null,
    nextPiece: null
};

// Elementos da UI
const scoreElement = document.getElementById('score');
const linesElement = document.getElementById('lines');
const levelElement = document.getElementById('level');
const startButton = document.getElementById('start-btn');
const resetButton = document.getElementById('reset-btn');

// Inicialização
function init() {
    resetGame();
    startButton.addEventListener('click', startGame);
    resetButton.addEventListener('click', resetGame);
    
    document.addEventListener('keydown', event => {
        if (gameOver) return;
        
        switch(event.keyCode) {
            case 37:
                move(-1);
                break;
            case 39:
                move(1);
                break;
            case 40:
                drop();
                break;
            case 38:
                rotate();
                break;
            case 32:
                pauseGame();
                break;
        }
    });
}

function createBoard() {
    return Array.from({length: BOARD_HEIGHT}, () => 
        Array.from({length: BOARD_WIDTH}, () => 0)
    );
}

function createPiece() {
    const pieceId = Math.floor(Math.random() * 7) + 1;
    return {
        shape: PIECES[pieceId].shape,
        color: PIECES[pieceId].color
    };
}

function draw() {
    ctx.fillStyle = '#0f3460';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = COLORS[value];
                ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        });
    });
    
    if (player.piece) {
        player.piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    ctx.fillStyle = COLORS[player.piece.color];
                    ctx.fillRect(
                        (player.pos.x + x) * BLOCK_SIZE,
                        (player.pos.y + y) * BLOCK_SIZE,
                        BLOCK_SIZE, BLOCK_SIZE
                    );
                    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                    ctx.strokeRect(
                        (player.pos.x + x) * BLOCK_SIZE,
                        (player.pos.y + y) * BLOCK_SIZE,
                        BLOCK_SIZE, BLOCK_SIZE
                    );
                }
            });
        });
    }
    
    drawNextPiece();
}

function drawNextPiece() {
    nextPieceCtx.fillStyle = '#0f3460';
    nextPieceCtx.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
    
    if (player.nextPiece) {
        const piece = player.nextPiece;
        const offsetX = (nextPieceCanvas.width / BLOCK_SIZE - piece.shape[0].length) / 2;
        const offsetY = (nextPieceCanvas.height / BLOCK_SIZE - piece.shape.length) / 2;
        
        piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    nextPieceCtx.fillStyle = COLORS[piece.color];
                    nextPieceCtx.fillRect(
                        (offsetX + x) * BLOCK_SIZE,
                        (offsetY + y) * BLOCK_SIZE,
                        BLOCK_SIZE, BLOCK_SIZE
                    );
                    nextPieceCtx.strokeStyle = 'rgba(255,255,255,0.3)';
                    nextPieceCtx.strokeRect(
                        (offsetX + x) * BLOCK_SIZE,
                        (offsetY + y) * BLOCK_SIZE,
                        BLOCK_SIZE, BLOCK_SIZE
                    );
                }
            });
        });
    }
}

function collide(board, player) {
    const [piece, pos] = [player.piece, player.pos];
    
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x] !== 0) {
                const boardX = pos.x + x;
                const boardY = pos.y + y;
                
                if (boardX < 0 || boardX >= BOARD_WIDTH || 
                    boardY >= BOARD_HEIGHT || 
                    (boardY >= 0 && board[boardY][boardX] !== 0)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function merge(board, player) {
    player.piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                const boardY = player.pos.y + y;
                if (boardY >= 0) {
                    board[boardY][player.pos.x + x] = player.piece.color;
                }
            }
        });
    });
}

function rotate() {
    const originalShape = player.piece.shape;
    
    const rotated = originalShape[0].map((_, index) =>
        originalShape.map(row => row[index]).reverse()
    );
    
    const originalPiece = player.piece.shape;
    player.piece.shape = rotated;
    
    if (collide(board, player)) {
        player.piece.shape = originalPiece;
    }
    
    draw();
}

function move(dir) {
    player.pos.x += dir;
    
    if (collide(board, player)) {
        player.pos.x -= dir;
    }
    
    draw();
}

function drop() {
    player.pos.y++;
    
    if (collide(board, player)) {
        player.pos.y--;
        merge(board, player);
        resetPiece();
        clearLines();
        updateScore();
    }
    
    dropCounter = 0;
    draw();
}

function resetPiece() {
    player.piece = player.nextPiece;
    player.nextPiece = createPiece();
    player.pos.y = 0;
    player.pos.x = Math.floor(BOARD_WIDTH / 2) - Math.floor(player.piece.shape[0].length / 2);
    
    if (collide(board, player)) {
        gameOver = true;
        alert('Game Over! Sua pontuação: ' + score);
    }
}

function clearLines() {
    let linesCleared = 0;
    
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        if (board[y].every(value => value !== 0)) {
            board.splice(y, 1);
            board.unshift(Array.from({length: BOARD_WIDTH}, () => 0));
            linesCleared++;
            y++;
        }
    }
    
    if (linesCleared > 0) {
        lines += linesCleared;
        score += linesCleared * 100 * level;
        
        level = Math.floor(lines / 10) + 1;
        dropInterval = 1000 / level;
        
        updateUI();
    }
}

function updateScore() {
    score += 10;
    updateUI();
}

function updateUI() {
    scoreElement.textContent = score;
    linesElement.textContent = lines;
    levelElement.textContent = level;
}

function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;
    
    dropCounter += deltaTime;
    
    if (dropCounter > dropInterval) {
        drop();
    }
    
    draw();
    
    if (!gameOver) {
        requestAnimationFrame(update);
    }
}

function startGame() {
    if (gameOver) {
        resetGame();
    }
    gameOver = false;
    update();
    startButton.disabled = true;
}

function pauseGame() {
    gameOver = !gameOver;
    if (!gameOver) {
        update();
    }
}

function resetGame() {
    board = createBoard();
    score = 0;
    lines = 0;
    level = 1;
    gameOver = false;
    dropInterval = 1000;
    
    player.nextPiece = createPiece();
    resetPiece();
    
    updateUI();
    draw();
    startButton.disabled = false;
}

window.addEventListener('load', init);