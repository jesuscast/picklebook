var express = require("express");
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json());

var http = require("http");

var admin = require("firebase-admin");
var serviceAccount = require("./dontlookhere/porn.json");
var firebase = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://pickleshit-822e5.firebaseio.com"
});

// Database setup:  root -> photos -> user_id -> links
var firebaseRoot = firebase.database().ref();
var photosDatabase = firebaseRoot.child("photos");



app.post("/add_link/", function(req, res) {
  var user_id = req.body.user_id;
  var link = req.body.link;
  console.log("adding link: " + link);
  addLink(user_id, link);
  res.send("success");
});


addLink("test_id", "google.com");



var options = {
  host: "amazon.com",
  path: "/index.html"
}

http.get(options, function(res) {
  console.log(res);
});



function addLink(user_id, link) {
  photosDatabase.child(user_id).child(encode(link)).set(true);
}



/* helpers */
function encode(url) {
  return encodeURIComponent(url).replace(/\./g, '%2E');
}

function decode(firebase_key) {
  return decodeURIComponent(firebase_key.replace(/\./g, '%2E'));
}


app.listen(3000);
console.log("server up");
