const generateId = require("./utils").generateId;
const { startPosition, isWhiteTurn, doMove } = require("./chessLogic");

function setupGameSessionFeatures(app, db) {
  app.post("/games/accept", function (req, res) {
    if ([null, undefined].includes(req.body)) {
      res
        .status(422)
        .send("You forgot to provide a value in the request body.");
      return;
    }

    const { gameId, emitterId, recipientId } = req.body;
    if ([gameId, emitterId, recipientId].includes(undefined)) {
      res
        .status(422)
        .send("You forgot to provide a value in the request body.");
      return;
    }

    let filter, document;
    filter = { ownId: { $eq: gameId } };

    db.collection("pendingrequests").findOne(filter, function (error, result) {
      if (error) {
        res
          .status(500)
          .send("Error while checking for the game request in the database.");
        return;
      } else if ([null, undefined].includes(result)) {
        res.status(400).send("Game request is not registered");
        return;
      }
      // Checking both emitterId and recipientId match.
      else if (
        result.emitterId !== emitterId ||
        result.recipientId !== recipientId
      ) {
        res.status(422).send("Either emitterId or recipientId does not match.");
      } else {
        const gameData = result;
        // deleting request from DB.

        db.collection("pendingrequests").deleteOne(filter, function (
          error,
          result
        ) {
          if (error) {
            res
              .status(500)
              .send(
                "Error while trying to delete the game request from the database."
              );
            return;
          } else {
            const ownId = generateId();
            let whiteId, blackId;
            if (["true", true].includes(gameData.recipientShouldHaveWhite)) {
              whiteId = gameData.recipientId;
              blackId = gameData.emitterId;
            } else {
              whiteId = gameData.emitterId;
              blackId = gameData.recipientId;
            }
            const status = "InProgress";
            const startDate = Date.now();
            const history = [];
            const currentPosition = startPosition();
            document = {
              ownId,
              whiteId,
              blackId,
              status,
              startDate,
              history,
              currentPosition,
            };
            db.collection("gamesessions").insertOne(document, function (
              error,
              result
            ) {
              if (error) {
                res
                  .status(500)
                  .send("Error while trying to create game session.");
              } else {
                res.send(result.ops[0]);
              }
            });
          }
        });
      }
    });
  });

  app.post("/games/move", function (req, res) {
    if ([null, undefined].includes(req.body)) {
      res
        .status(422)
        .send("You forgot to provide a value in the request body.");
      return;
    }

    const {
      sessionId,
      playerId,
      startFile,
      startRank,
      endFile,
      endRank,
      promotion,
    } = req.body;

    if (
      [sessionId, playerId, startFile, startRank, endFile, endRank].includes(
        undefined
      )
    ) {
      res
        .status(422)
        .send("You forgot to provide a value in the request body.");
      return;
    }

    let filter, document;
    filter = { ownId: { $eq: sessionId } };

    db.collection("gamesessions").findOne(filter, function (error, resultGet) {
      if (error) {
        res
          .status(500)
          .send("Error while checking for the game session in the database.");
        return;
      } else if ([null, undefined].includes(resultGet)) {
        res.status(400).send("Game session is not registered");
        return;
      } else {
        if (![resultGet.whiteId, resultGet.blackId].includes(playerId)) {
          res.status(401).send("You are not a player of the game.");
          return;
        } else {
          const gameTurnIsWhite = isWhiteTurn(resultGet.currentPosition);
          const isPlayerInTurn =
            (gameTurnIsWhite && resultGet.whiteId === playerId) ||
            (!gameTurnIsWhite && resultGet.blackId === playerId);

          const startFileNum = parseInt(startFile);
          const startRankNum = parseInt(startRank);
          const endFileNum = parseInt(endFile);
          const endRankNum = parseInt(endRank);

          const wrongCoordinatesFormat =
            isNaN(startFileNum) ||
            isNaN(startRankNum) ||
            isNaN(endFileNum) ||
            isNaN(endRankNum);

          const notInRangeCoordinates =
            startFile < 0 ||
            startFile > 7 ||
            endFile < 0 ||
            endFile > 7 ||
            startRank < 0 ||
            startRank > 7 ||
            endRank < 0 ||
            endRank > 7;
          if (resultGet.status === "Ended") {
            res.status(401).send("Game is already ended");
            return;
          } else if (!isPlayerInTurn) {
            res.status(401).send("You are not the player in turn.");
            return;
          } else if (wrongCoordinatesFormat) {
            res.status(422).send("Bad move coordinates format.");
            return;
          } else if (notInRangeCoordinates) {
            res
              .status(422)
              .send("Some coordinates are not in board range [0-7].");
            return;
          } else {
            const moveData = {
              startFile: startFileNum,
              startRank: startRankNum,
              endFile: endFileNum,
              endRank: endRankNum,
              promotion: promotion,
            };
            const position = resultGet.currentPosition;
            const moveToCommit = doMove(position, moveData);
            if (!moveToCommit) {
              res.status(422).send("Illegal move.");
              return;
            } else {
              document = resultGet;
              document.history.push(moveToCommit.moveSan);
              document.currentPosition = moveToCommit.position;
              document.status = moveToCommit.status;
              document.lastMoveDate = Date.now();

              db.collection("gamesessions").updateOne(
                filter,
                { $set: document },
                function (error, resultUpdate) {
                  if (error) {
                    console.log(error);
                    res
                      .status(500)
                      .send(
                        "Error while trying to update the the game session in the database."
                      );
                    return;
                  } else {
                    const resultToSend = {
                      san: moveToCommit.moveSan,
                      status: moveToCommit.status,
                    };
                    res.send(resultToSend);
                  }
                }
              );
            }
          }
        }
      }
    });
  });

  app.post("/games/clean", function (req, res) {
    const oldDateLimit = Date.now() - 1000 * 60 * 15;
    db.collection("gamesessions").deleteMany(
        {
          lastMoveDate: { $lt: oldDateLimit },
          status: { $eq : "Ended" }
        },
        function(error, result) {
          if (error) {
            res.status(500).send("Failed to clean up old games.");
            return;
          }
          res.send("Old games clean up success.")
        }
    );
  });
}

module.exports = {
  setupGameSessionFeatures,
};
