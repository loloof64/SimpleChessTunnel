const { Chess } = require('chess.js');

function startPosition() {
    const chess = new Chess();
    return chess.fen();
}

function isWhiteTurn(position) {
    const chess = new Chess(position);
    return chess.turn() === 'w';
}

function coordsAsAlgebraic(file, rank) {
    let result = "";
    result += String.fromCharCode("a".charCodeAt(0) + file);
    result += String.fromCharCode("1".charCodeAt(0) + rank);

    return result;
}

function getMove(position, moveData) {
    const {startFile, startRank, endFile, endRank, promotion} = moveData;
    const chess = new Chess(position);
    const from = coordsAsAlgebraic(startFile, startRank);
    const to = coordsAsAlgebraic(endFile, endRank);
    let moveToDo = {
        from, to
    };
    if (promotion)
    {
        moveToDo = {...moveToDo, promotion: promotion.toLowerCase()};
    }
    
    const moveToCommit = chess.move(moveToDo);
    const InProgressStatus = "InProgress";
    const EndedStatus = "Ended";

    let status = InProgressStatus;
    if (chess.in_checkmate()) status = EndedStatus;
    if (chess.in_stalemate()) status = EndedStatus;
    if (chess.in_threefold_repetition()) status = EndedStatus;
    if (chess.in_draw()) status = EndedStatus;

    if (moveToCommit) {
        return {
            moveSan: moveToCommit.san,
            position: chess.fen(),
            status,
        }
    }
    else {
        return undefined;
    }
}

function doMove(position, moveData) {
    return getMove(position, moveData);
}

module.exports = {
    startPosition,
    isWhiteTurn,
    doMove,
};