const generateId = require("./utils").generateId;

function setUpConnectionFeatures(app, db) {
  app.post("/users", function (req, res) {
    db.collection("users")
      .find()
      .toArray(function (err, result) {
        if (err) {
          res.status(500).send("Cannot access users data.");
          return;
        } else {
          res.send(result);
          return;
        }
      });
  });

  app.post("/users/register", function (req, res) {
    if ([null, undefined].includes(req.body)) {
      res
        .status(422)
        .send("You forgot to provide a value in the request body.");
      return;
    }

    const { name } = req.body;

    if ([name].includes(undefined)) {
      res
        .status(422)
        .send("You forgot to provide a value in the request body.");
      return;
    }

    const ownId = generateId();
    const data = {
      name,
      ownId,
    };
    const filter = { name: { $eq: name } };

    db.collection("users").countDocuments(filter, function (error, result) {
      if (error) {
        res.status(500).send("Error when searching for already existing name.");
        return;
      } else {
        if (result > 0) {
          res.status(422).send("Name is already taken currently");
          return;
        } else {
          db.collection("users").insertOne(data, function (error, result) {
            if (error) {
              res.status(500).send("Error registering the user : " + error);
              return;
            } else {
              res.send(ownId);
              return;
            }
          });
        }
      }
    });
  });

  app.post("/users/disconnect/:id", function (req, res) {
    const id = req.params.id;
    const filter = { ownId: { $eq: id } };

    db.collection("users").deleteOne(filter, function (error, result) {
      if (error) {
        res.status(500).send("Error deleting the user.");
        return;
      } else {
        if (result.result.ok && result.result.n == 1) {
          res.send("Success");
          return;
        } else {
          res.status(422).send("Not a registered user");
          return;
        }
      }
    });
  });
}

module.exports = {
  setUpConnectionFeatures,
};
