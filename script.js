const icons = {
    // We are now using <rect> shapes instead of <line> to get control over corners
    x: `<svg viewBox="0 0 100 100" class="icon-x">
          <!-- 
            rx="3" defines the specific corner radius. 
            Decrease for sharper, Increase for more bubbly.
          -->
          
          <!-- Bar 1 (Backslash "\") -->
          <rect 
            x="45" y="10" 
            width="10" height="80" 
            rx="3" 
            fill="currentColor" 
            transform="rotate(45 50 50)"
          />
          
          <!-- Bar 2 (Forward slash "/") -->
          <rect 
            x="45" y="10" 
            width="10" height="80" 
            rx="3" 
            fill="currentColor" 
            transform="rotate(-45 50 50)"
          />
        </svg>`,
        
    o: `<svg viewBox="0 0 100 100" class="icon-o">
          <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" stroke-width="10" />
        </svg>`
};

const gameBoard = (function() {

    let board = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]        
    ];

    const getBoard = () => board;

    const resetBoard = () => {
        board = board.map(row => row.map(cell => 0));
    };

    const placeMarker = (cell, marker) => {

        const row = Math.floor((cell - 1) / 3);
        const col = (cell - 1) % 3;

        if (board[row][col] === 0) {
            board[row][col] = marker;
            return true;
        } else {

            return false;
        }
    }

    return { getBoard, placeMarker, resetBoard };

})();


const Player = (name, marker) => {
    
    let score = 0;
    const getScore = () => score;
    const giveScore = () => score++;

    return { name, marker, getScore, giveScore };

};

const player1 = Player("Player 1", "X");
const player2 = Player("Player 2", "O");


const gameController = (function() {

    let isGameOver = false;
    let activePlayer = player1;
    let roundCount = 1;
    let tieCount = 0;

    const getIsGameOver = () => isGameOver;

    const getActivePlayer = () => activePlayer;

    const getScores = () => {
        return {
            p1: player1.getScore(),
            tie: tieCount,
            p2: player2.getScore()
        };
    };

    const switchTurn = () => {
        activePlayer = (activePlayer === player1) ? player2 : player1; 
    };

    const restartGame = () => {
        gameBoard.resetBoard();
        isGameOver = false;
        roundCount++;
        activePlayer = (roundCount % 2 !== 0) ? player1 : player2;

    };

    const checkWin = () => {
        const board = gameBoard.getBoard();
        const winConditions = [
            [[0, 0], [0, 1], [0, 2]], [[1, 0], [1, 1], [1, 2]], [[2, 0], [2, 1], [2, 2]], // Rows
            [[0, 0], [1, 0], [2, 0]], [[0, 1], [1, 1], [2, 1]], [[0, 2], [1, 2], [2, 2]], // Cols
            [[0, 0], [1, 1], [2, 2]], [[0, 2], [1, 1], [2, 0]]                          // Diagonals
        ];

        return winConditions.some(condition => 
            condition.every(([r, c]) => board[r][c] === activePlayer.marker)
        );
    };

    const checkTie = () => {
        // If every row in the board contains NO zeros, the board is full
        return gameBoard.getBoard().every(row => row.every(cell => cell !== 0));
    };

    const playRound = (cell) => {
        
        if (isGameOver) {

            return; 
        }

        const success = gameBoard.placeMarker(cell, activePlayer.marker);

        if (success) {
            if (checkWin()) {

                isGameOver = true;
                activePlayer.giveScore();
                displayController.updateScores();
                displayController.showOverlay();

            } else if (checkTie()) {

                isGameOver = true;
                tieCount++;
                displayController.updateScores();
                displayController.showOverlay();

            } else {
                // 3. No win, no tie? Keep playing.
                switchTurn();
            }
        }

    };

    return { playRound, restartGame, getIsGameOver, getActivePlayer, getScores };

})();


const displayController = (function() {

    const updateScores = () => {
        // 1. Ask the logic engine for the current numbers
        const scores = gameController.getScores();

        // 2. Update the HTML elements we set up earlier
        document.querySelector('#p1-score').textContent = scores.p1;
        document.querySelector('#tie-score').textContent = scores.tie;
        document.querySelector('#p2-score').textContent = scores.p2;
    };

    const boardContainer = document.querySelector('#game-board');
    const p1Box = document.querySelector('.p1-box');
    const p2Box = document.querySelector('.p2-box');
    const overlay = document.querySelector('#restart-overlay');

    const init = () => {
        // We listen to the CONTAINER, not the individual cells
        boardContainer.addEventListener('click', (e) => {
        const rawIndex = e.target.dataset.index;

        if (rawIndex) {
            // Convert to number before sending it to the logic engine
            const cellIndex = Number(rawIndex); 
            
            gameController.playRound(cellIndex);
            render();
        }
        });

        overlay.addEventListener('click', () => {
            gameController.restartGame(); // Run your logic
            hideOverlay();                // Remove the screen guard
            render();                     // Draw the fresh board
        });

        render();
    };

    const showOverlay = () => {
        overlay.classList.remove('hidden');
    };

    const hideOverlay = () => {
        overlay.classList.add('hidden');
    };

    const render = () => {
        const board = gameBoard.getBoard().flat();
        const cells = document.querySelectorAll('.cell');

        cells.forEach((cell, i) => {
            const marker = board[i];

            // 1. If there's a marker but the cell is VISUALLY empty, add it
            if (marker !== 0 && cell.innerHTML === "") {
                cell.innerHTML = (marker === "X") ? icons.x : icons.o;
            } 
            
            // 2. If the logic board is empty but the cell HAS an icon, clear it
            // (This handles your Restart functionality)
            else if (marker === 0 && cell.innerHTML !== "") {
                cell.innerHTML = "";
            }
        });

        updateVisualState();

    };

    const updateVisualState = () => {
    const isGameOver = gameController.getIsGameOver();
    const activePlayer = gameController.getActivePlayer();
    
    // Grab your UI boxes
    const p1Box = document.querySelector('.p1-box');
    const p2Box = document.querySelector('.p2-box');
    const tieBox = document.querySelector('.tie-box');

    if (!isGameOver) {
        // --- State: GAME IN PROGRESS ---
        // Dim the Tie/Round score
        tieBox.classList.add('muted');
        
        // Spotlight the active player, dim the idle one
        if (activePlayer.marker === "X") {
            p1Box.classList.add('active');
            p1Box.classList.remove('muted');
            
            p2Box.classList.add('muted');
            p2Box.classList.remove('active');
        } else {
            p2Box.classList.add('active');
            p2Box.classList.remove('muted');
            
            p1Box.classList.add('muted');
            p1Box.classList.remove('active');
        }
    } else {
        // --- State: GAME OVER ---
        // Light everything up! 
        p1Box.classList.add('active');
        p1Box.classList.remove('muted');
        
        p2Box.classList.add('active');
        p2Box.classList.remove('muted');
        
        tieBox.classList.add('active');
        tieBox.classList.remove('muted');
    }
    };


    return { init, render, showOverlay, updateScores, updateVisualState };
})();


displayController.init();