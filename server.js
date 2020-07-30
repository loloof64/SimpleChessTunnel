const express = require("express");
const { setUpConnectionFeatures } = require("./UserConnection");
const { setupGameRequestFeatures } = require("./GameRequest");
const app = express();
const MongoClient = require("mongodb").MongoClient;


const PORT = 3000;
const DATABASE_URL = "mongodb://localhost:27017";
const DATABASE_NAME = "simplechesstunnel";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let db;

MongoClient.connect(DATABASE_URL, function (err, client) {
  if (err) throw err;

  db = client.db(DATABASE_NAME);
  setUpConnectionFeatures(app, db);
  setupGameRequestFeatures(app, db);
});

app.listen(PORT, function () {
  console.log("App is ready.");
});
