const express = require("express");
const app = express();
const MongoClient = require("mongodb").MongoClient;

const PORT = 3000;
const DATABASE_URL = "mongodb://localhost:27017";
const DATABASE_NAME = "simplechesstunnel";

let db;

MongoClient.connect(DATABASE_URL, function (err, client) {
  if (err) throw err;

  db = client.db(DATABASE_NAME);
});

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
  const data = {
    name,
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
        db.collection("users").insertOne(data, function (error) {
          if (error) {
            res.send("#Error registering the user : " + error);
            return;
          } else {
            res.send("Success");
            return;
          }
        });
      }
    }
  });
});

app.post("/users/disconnect/:name", function (req, res) {
  if (!db) {
    res.send("#Cannot access database.");
  }

  const name = req.params.name;
  const filter = { name: { $eq: name } };

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

app.listen(PORT, function () {
  console.log("App is ready.");
});
