const express = require("express");
const app = express();
const client = require("redis").createClient();

const PORT = 3000;

client.on("error", function (err) {
  console.log("Error " + err);
});

app.post("/users", function (req, res) {
  client.smembers("users", function (err, users) {
    if (err) {
      res.send("Error getting users.");
    } else {
      res.send(users);
    }
  });
});

app.post("/users/register/:name", function (req, res) {
  const name = req.params.name;
  client.sadd("users", name, function (err, isAdded) {
    if (err) {
      res.send("Error trying to register user.");
    } else {
      if (isAdded) {
        res.send("Done registering user.");
      } else {
        res.send("User is already registered.");
      }
    }
  });
});

app.post("/users/disconnect/:name", function (req, res) {
    const name = req.params.name;
    client.srem("users", name, function (err, isRemoved) {
        if (err) {
            res.send("Error trying to disconnect user.");
          } else {
            if (isRemoved) {
              res.send("Done disconnecting user.");
            } else {
              res.send("User is already disconnected.");
            }
          }
    });
});

app.listen(PORT, function () {
  console.log("App is ready.");
});
