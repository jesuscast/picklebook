var express = require("express");
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json());

var fs = require("fs");
var request = require("request");

var aws = require("aws-sdk");
aws.config.loadFromPath('../../Desktop/credentials.json');
var s3 = new aws.S3();

// Call S3 to list current buckets
/*
s3.listBuckets(function(err, data) {
   if (err) {
      console.log("Error", err);
   } else {
      console.log("Bucket List", data.Buckets);
   }
});
*/

var admin = require("firebase-admin");
var serviceAccount = require("./dontlookhere/porn.json");
var firebase = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://pickleshit-822e5.firebaseio.com"
});

// Database setup:  root -> photos -> user_id -> links
var firebaseRoot = firebase.database().ref();
var photosDatabase = firebaseRoot.child("photos");

const temp_filename = "temp.jpg";

app.post("/add_link", function(req, res) {
  var user_id = req.body.user_id;
  var link = req.body.link;
  console.log("user: " + user_id);
  console.log("adding link: " + link);
  imageToS3(user_id, link, function(err) {
    if (!err) {
      res.send({success: true});
    }
    else {
      res.send({success: false});
    }
  });
});

app.get("/links/:user_id", function(req, res) {
  var user_id = req.params.user_id;
  if (!user_id) {
    res.send("bad user_id");
  }
  getLinks(user_id, function(links) {
    res.send({links: links});
  });
});

app.get("/photo/:user_id/:link", function(req, res) {
  var user_id = req.params.user_id;
  var link = req.params.link;
  if (!user_id || !link) {
    return res.send(null);
  }
  var key_arr = link.split("/");
  if (key_arr.length > 0) {
    var key = key_arr[key_arr.length-1];
    var params = {Bucket: 'picklebook.images', Key: user_id + "/" + key};
    return s3.getObject(params).createReadStream().pipe(res);
  }
  return res.send(null);
});

//imageToS3("tester", "http://facebook/asdf.jpg");
//imageToS3("tester", "https://scontent.fsnc1-3.fna.fbcdn.net/v/t1.0-9/20882096_10209673832787069_6187247544155216128_n.jpg?oh=fd6155bfe35a2b6b8ec3c1705f847214&oe=5A2BF846");

//getLinks("tester");

// downloads image at url to temp.jpg and then uploads temp.jpg to picklebook.images/user_id
// adds image link to user's link database on firebase
function imageToS3(user_id, url, callback) {
  download(url, temp_filename, function(err) {
    if (!err) {
      upload(user_id, temp_filename, function(file_location) {
        addLink(user_id, file_location);
        callback(null);
      });
    }
    else {
      console.log(err);
      callback(err);
    }
  });
}

function upload(user_id, filename, callback) {
  var uploadStream = fs.createReadStream(filename);
  var s3path = user_id + "/" + "hotgirl-" + Date.now() + ".jpg";
  var params = {Bucket: "picklebook.images", Key: s3path, Body: uploadStream};
  s3.upload(params, function(err, data) {
    if (data) {
      console.log("upload location: " + data.Location);
      callback(data.Location);
    }
    else {
      callback(null);
    }
  });
}

function download(url, filename, callback) {
  request.head(url, function(err, res, body) {
    if (!res || !res.headers) {
      return callback("Error -- not valid link: " + url);
    }
    var content_type = res.headers["content-type"];
    console.log("content-type:", content_type);
    if (content_type == "image/jpeg" || content_type == "image/png") {
      request(url).pipe(fs.createWriteStream(filename)).on("close", callback);
    }
    else {
      callback("Error -- not valid jpg: " + url);
    }
  });
}


function addLink(user_id, link) {
  photosDatabase.child(user_id).child(encode(link)).set(true);
}

function getLinks(user_id, callback) {
  photosDatabase.child(user_id).once("value", function(snapshot) {
    val = snapshot.val();
    var links = Object.keys(val);
    console.log(links);
    if (callback) {
      var decoded_links = links.map(decode);
      callback(decoded_links);
    }
  });
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
