const generateId = require("./utils").generateId;

function setupGameSessionFeatures(app, db) {
  app.post("/game/accept", function (req, res) {
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

    let filter;
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
          }
          else {
              res.send("Starting game "+gameId);
          }
        });
      }
    });
  });
}

module.exports = {
  setupGameSessionFeatures,
};
