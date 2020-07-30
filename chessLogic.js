const { Chess } = require('chess.js');

function startPosition() {
    const chess = new Chess();
    return chess.fen();
}

module.exports = {
    startPosition,
};