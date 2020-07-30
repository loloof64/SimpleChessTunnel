const express = require("express");
const app = express();
const MongoClient = require("mongodb").MongoClient;

const setUpConnectionFeatures = require('./UserConnection').setUpConnectionFeatures;

const PORT = 3000;
const DATABASE_URL = "mongodb://localhost:27017";
const DATABASE_NAME = "simplechesstunnel";

let db;

MongoClient.connect(DATABASE_URL, function (err, client) {
  if (err) throw err;

  db = client.db(DATABASE_NAME);
  setUpConnectionFeatures(app, db);
});

app.listen(PORT, function () {
  console.log("App is ready.");
});
