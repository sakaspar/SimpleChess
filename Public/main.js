const socket = io();
const boardEl = document.querySelector('.board');
let gameId = getGameId();
let selectedSquare = null;

socket.on('connect', () => {
  socket.emit('joinGame', gameId);
});

socket.on('newGame', gameId => {
  const gameLink = `${window.location.href}?game=${gameId}`;
  const gameLinkText = `Share this link with your friend: <a href="${gameLink}">${gameLink}</a>`;
  document.body.innerHTML += gameLinkText;
});

socket.on('joinGame', gameId => {
  const gameLink = `${window.location.href}?game=${gameId}`;
  const gameLinkText = `You joined the game! Share this link with your friend: <a href="${gameLink}">${gameLink}</a>`;
  document.body.innerHTML += gameLinkText;
});

socket.on('gameState', fen => {
  updateBoard(fen);
});

socket.on('opponentDisconnected', () => {
  alert('Your opponent has disconnected. The game will be reset.');
  resetGame();
});

function updateBoard(fen) {
  boardEl.innerHTML = '';
  const position = fen.split(' ')[0];

  for (let i = 0; i < position.length; i++) {
    const square = document.createElement('div');
    square.className = `square ${getColor(i)}`;
    square.dataset.square = i;
    square.textContent = position[i];
    square.addEventListener('click', handleSquareClick);
    boardEl.appendChild(square);
  }
}

function getColor(index) {
  const row = Math.floor(index / 8);
  const col = index % 8;
  return (row + col) % 2 === 0 ? 'white' : 'black';
}

function handleSquareClick(e) {
  const square = e.target;
  const squareIndex = parseInt(square.dataset.square);

  if (!selectedSquare) {
    if (square.textContent !== '.') {
      selectedSquare = squareIndex;
      square.classList.add('selected');
    }
  } else {
    if (squareIndex !== selectedSquare) {
      const move = {
        from: selectedSquare,
        to: squareIndex,
      };
      socket.emit('makeMove', move);
    }

    selectedSquare = null;
    const selectedSquareEl = document.querySelector('.square.selected');
    if (selectedSquareEl) {
      selectedSquareEl.classList.remove('selected');
    }
  }
}

function resetGame() {
  selectedSquare = null;
  const selectedSquareEl = document.querySelector('.square.selected');
  if (selectedSquareEl) {
    selectedSquareEl.classList.remove('selected');
  }
}

function getGameId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('game');
}
