const express = require("express");
const app = express();
const client = require("redis").createClient();

const PORT = 3000;

client.on("error", function (err) {
  console.log("Error " + err);
});

function generateId() {
  const elementsSet = "0123456789abcdefghijklmnopqrstuvwxyz";
  const idSize = 10;
  let id = "";
  for (let i = 0; i < idSize; i++) {
    let index = Math.floor(Math.random() * elementsSet.length);
    let currentElement = elementsSet.charAt(index);
    id += currentElement;
  }

  return id;
}

app.post("/users", function (req, res) {
  client.hgetall("users", function (err, users) {
    if (err) {
      res.send("#Error getting users.");
    } else {
      res.send(Object.keys(users));
    }
  });
});

app.post("/users/register/:name", function (req, res) {
  const name = req.params.name;
  const id = generateId();

  client.hexists("users", id, function (err, exists) {
    if (err) {
      res.send("#Could not check if user id is already used.");
      return;
    }
    if (exists) {
      res.send("#User id is already used.");
      return;
    }
  });

  client.hset("users", id, name, function (err) {
    if (err) {
      res.send("#Error trying to register user.");
    } else {
      res.send(id);
    }
  });
});

app.post("/users/disconnect/:id", function (req, res) {
  const id = req.params.id;
  client.hdel("users", id, function (err, isRemoved) {
    if (err) {
      res.send("#Error trying to disconnect user.");
    } else {
      if (isRemoved) {
        res.send("Done disconnecting user.");
      } else {
        res.send("#It is not a registered user.");
      }
    }
  });
});

app.listen(PORT, function () {
  console.log("App is ready.");
});
