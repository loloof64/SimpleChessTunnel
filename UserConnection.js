function generateId() {
  const elementsSet = "0123456789abcdefghijklmnopqrstuvwxyz";
  const idSize = 30;
  let id = "";
  for (let i = 0; i < idSize; i++) {
    let index = Math.floor(Math.random() * elementsSet.length);
    let currentElement = elementsSet.charAt(index);
    id += currentElement;
  }

  return id;
}

function setUpConnectionFeatures(app, db) {
  app.post("/users", function (req, res) {
    if (!db) {
      res.send("#Cannot access database.");
      return;
    }

    db.collection("users")
      .find()
      .toArray(function (err, result) {
        if (err) {
          res.send("#Cannot access users data.");
          return;
        } else {
          res.send(result);
          return;
        }
      });
  });

  app.post("/users/register/:name", function (req, res) {
    if (!db) {
      res.send("#Cannot access database.");
      return;
    }

    const name = req.params.name;
    const serverId = generateId();
    const data = {
      name, serverId
    };
    const filter = { name: { $eq: name } };

    db.collection("users").countDocuments(filter, function (error, result) {
      if (error) {
        res.send("#Error when searching for already existing name : " + error);
        return;
      } else {
        if (result > 0) {
          res.send("#Name is already taken currently");
          return;
        } else {
          db.collection("users").insertOne(data, function (error, result) {
            if (error) {
              res.send("#Error registering the user : " + error);
              return;
            } else {
              res.send(serverId);
              return;
            }
          });
        }
      }
    });
  });

  app.post("/users/disconnect/:id", function (req, res) {
    if (!db) {
      res.send("#Cannot access database.");
    }

    const id = req.params.id;
    const filter = { serverId: { $eq: id } };

    db.collection("users").deleteOne(filter, function (error, result) {
      if (error) {
        res.send("#Error deleting the user : " + error);
        return;
      } else {
        if (result.result.ok && result.result.n == 1) {
          res.send("Success");
          return;
        } else {
          res.send("Not a registered user");
          return;
        }
      }
    });
  });
}

module.exports = {
  setUpConnectionFeatures,
};
