const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const chess = require('chess.js');

let games = {};

app.use(express.static('public'));

io.on('connection', socket => {
  let game;

  socket.on('joinGame', gameId => {
    if (!gameId || !games[gameId]) {
      game = createGame();
      socket.emit('newGame', game.id);
    } else {
      game = games[gameId];
      socket.emit('joinGame', game.id);
    }

    socket.join(game.id);
    socket.emit('gameState', game.board.fen());
  });

  socket.on('makeMove', move => {
    if (game && game.playerTurn === socket.id) {
      const validMove = game.board.move(move, { sloppy: true });
      if (validMove) {
        game.playerTurn = getOpponent(socket.id);
        io.to(game.id).emit('gameState', game.board.fen());
      }
    }
  });

  socket.on('disconnect', () => {
    if (game && game.playerTurn === socket.id) {
      io.to(game.id).emit('opponentDisconnected');
    }
  });
});

function createGame() {
  const game = {
    id: Math.random().toString(36).substring(7),
    board: new chess.Chess(),
    playerTurn: null,
  };

  games[game.id] = game;
  return game;
}

function getOpponent(playerId) {
  const game = Object.values(games).find(game => game.playerTurn === playerId);
  return game ? Object.keys(game.boardHistory).find(id => id !== playerId) : null;
}

http.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
