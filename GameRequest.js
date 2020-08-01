const generateId = require("./utils").generateId;

function setupGameRequestFeatures(app, db) {
  app.post("/game/new", function (req, res) {
    if ([null, undefined].includes(req.body)) {
      res
        .status(422)
        .send("You forgot to provide a value in the request body.");
      return;
    }

    const { emitterId, recipientName, emitterShouldHaveWhite } = req.body;

    // Checking that no parameter is missing

    if (
      [emitterId, recipientName, emitterShouldHaveWhite].includes(undefined)
    ) {
      res
        .status(422)
        .send("You forgot to provide a value in the request body.");
      return;
    }

    let filter, document;

    // Checking that emitter is a registered user

    filter = { ownId: { $eq: emitterId } };
    db.collection("users").findOne(filter, function (error, result) {
      if (error) {
        res
          .status(500)
          .send("Error while checking for the emitter in the database.");
        return;
      } else if ([null, undefined].includes(result)) {
        res.status(400).send("Emitter is not registered");
        return;
      } else {
        // Checking that recipient is a registered user

        const emitterName = result.name;

        filter = { name: { $eq: recipientName, $ne: emitterName } };
        db.collection("users").findOne(filter, function (error, result) {
          if (error) {
            res
              .status(500)
              .send("Error while checking for the recipient in the database.");
            return;
          } else if ([null, undefined].includes(result)) {
            res
              .status(400)
              .send(
                "Recipient is not registered or is the same as the emitter."
              );
            return;
          } else {
            // Creating the request
            const recipientId = result.ownId;
            const recipientShouldHaveWhite = ![true, "true"].includes(
              emitterShouldHaveWhite
            );
            const ownId = generateId();
            const date = Date.now();
            document = {
              ownId,
              emitterId,
              emitterName,
              recipientId,
              recipientName,
              recipientShouldHaveWhite,
              date,
            };
            db.collection("pendingrequests").insertOne(document, function (
              error,
              result
            ) {
              if (error) {
                res.status(500).send("Error while creating the request");
              } else {
                const resultObj = result.ops[0];
                const responseObj = {
                  ownId: resultObj.ownId,
                  emitterName: resultObj.emitterName,
                  recipientName: resultObj.recipientName,
                  recipientShouldHaveWhite: resultObj.recipientShouldHaveWhite,
                  date,
                };
                res.send(responseObj);
              }
            });
          }
        });
      }
    });
  });

  app.post("/requests/all", function (req, res) {
    if ([null, undefined].includes(req.body)) {
      res
        .status(422)
        .send("You forgot to provide a value in the request body.");
      return;
    }

    const { ownId } = req.body;

    if ([ownId].includes(undefined)) {
      res
        .status(422)
        .send("You forgot to provide a value in the request body.");
      return;
    }

    let filter;

    // Checking that user exists
    filter = { ownId: { $eq: ownId } };
    db.collection("users").findOne(filter, function (error, result) {
      if (error) {
        res.status(500).send("Error while trying to check that user exists");
        return;
      } else {
        if ([null, undefined].includes(result)) {
          res.status(422).send("The requested user is not registered.");
          return;
        } else {
          // Getting requests
          filter = { recipientId: { $eq: ownId } };
          db.collection("pendingrequests")
            .find(filter)
            .toArray(function (err, result) {
              if (err) {
                res.status(500).send("Error while reading results");
                return;
              } else {
                const filteredResult = result.map(function (current) {
                  return {
                    ownId: current.ownId,
                    emitterName: current.emitterName,
                    recipientShouldHaveWhite: current.recipientShouldHaveWhite,
                    date: current.date,
                  };
                });
                res.send(filteredResult);
              }
            });
        }
      }
    });
  });

  app.post("/requests/cancel", function (req, res) {
    if ([null, undefined].includes(req.body)) {
      res
        .status(422)
        .send("You forgot to provide a value in the request body.");
      return;
    }

    const { requestId, emitterId } = req.body;

    if ([requestId, emitterId].includes(undefined)) {
      res
        .status(422)
        .send("You forgot to provide a value in the request body.");
      return;
    }

    let filter, document;

    // Checking that the request exists
    filter = { ownId: { $eq: requestId } };
    db.collection("pendingrequests").findOne(filter, function (error, result) {
      if (error) {
        res.status(500).send("Error while trying to check that request exists");
        return;
      } else {
        if ([null, undefined].includes(result)) {
          res.status(422).send("The request is not registered.");
          return;
        } else {
          if (result.emitterId !== emitterId) {
            res.status(401).send("You are not the emitter of the request.");
            return;
          } else {
            // removing the request
            db.collection("pendingrequests").findOneAndDelete(filter, function (
              error,
              result
            ) {
              if (error) {
                res
                  .status(500)
                  .send("Error while trying to delete the request.");
                return;
              } else {
                res.send("Request cancelled");
              }
            });
          }
        }
      }
    });
  });
}

module.exports = {
  setupGameRequestFeatures,
};
