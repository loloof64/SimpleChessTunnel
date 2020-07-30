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

    filter = { serverId: { $eq: emitterId } };
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
            const recipientId = result.serverId;
            const recipientShouldHaveWhite = ![true, "true"].includes(
              emitterShouldHaveWhite
            );
            const date = Date.now();
            document = {
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

    const { serverId } = req.body;

    if ([serverId].includes(undefined)) {
      res
        .status(422)
        .send("You forgot to provide a value in the request body.");
      return;
    }

    let filter;

    // Checking that user exists
    filter = { serverId: { $eq: serverId } };
    db.collection("users").findOne(filter, function (error, result) {
      if (error) {
        res.status(500).send("Error while trying to check that user exists");
      } else {
        // Getting requests
        filter = { recipientId: { $eq: serverId } };
        db
          .collection("pendingrequests")
          .find(filter)
          .toArray(function (err, result) {
            if (err) {
              res.status(500).send("Error while reading results");
              return;
            } else {
              res.send(result);
            }
          });
      }
    });
  });
}

module.exports = {
  setupGameRequestFeatures,
};
