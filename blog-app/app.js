var express = require("express");
var methodOverride = require("method-override");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var expressSanitizier = require("express-sanitizer");

// APP CONFIG
mongoose.connect("mongodb://localhost/blog-app", {
  useNewUrlParser: true
});
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride("_method")); // Treat whatever the _method value is set to as the method type
app.use(bodyParser.urlencoded({ extended: true }));

// MONGOOSE/MODEL CONFIG
var blogSchema = new mongoose.Schema({
  title: String,
  image: String,
  body: String,
  create: { type: Date, default: Date.now }
});

// DATABASE
var Blog = mongoose.model("Blog", blogSchema);
// Blog.create({
//   title: "LA FLAME",
//   image:
//     "https://thefader-res.cloudinary.com/private_images/w_760,c_limit,f_auto,q_auto:best/travis-scott-cyber-monday-astroworld-festival-merch-sale_amkqak/travis-scott-kanye-west-maga-trump.jpg",
//   body: "WISH YOU WERE HERE"
// });

// Travis Discography
app.get("/blogs/rodeo", function(req, res) {
  res.render("rodeo");
});
app.get("/blogs/birds", function(req, res) {
  res.render("birds");
});
app.get("/blogs/astro", function(req, res) {
  res.render("astro");
});
app.get("/blogs/mixtape", function(req, res) {
  res.render("mixtape");
});

//RESTFUL ROUTES
app.get("/", function(req, res) {
  res.render("ThePrayer", { music: "/audio/cantsay.mp3" });
  // res.sendFile(__dirname + "/audio/prayer.html");
  // console.log("GET PRAYER");
});

// Index route (Home page)
app.get("/blogs", function(req, res) {
  // Grabbing stuff from Database Blog
  Blog.find({}, function(err, blogs) {
    if (err) {
      console.log("ERROR!");
    } else {
      res.render("index", { blogs: blogs });
      console.log("??? : " + blogs._id);
    }
  });
  // res.render("index");
});

// NEW ROUTE
app.get("/blogs/new", function(req, res) {
  res.render("new");
});

//CREATE ROUTE
app.post("/blogs", function(req, res) {
  //create blog
  Blog.create(req.body.blog, function(err, newBlog) {
    if (err) {
      res.render("new");
    } else {
      // then, redirect to the index if there is no error
      res.redirect("/blogs");
    }
  });
});

// SHOW ROUTE
app.get("/blogs/:id", function(req, res) {
  Blog.findById(req.params.id, function(err, foundBlog) {
    if (err) {
      res.redirect("/blogs");
    } else {
      res.render("show", { blog: foundBlog });
    }
  });
});

// EDIT ROUTE
app.get("/blogs/:id/edit", function(req, res) {
  Blog.findById(req.params.id, function(err, foundBlog) {
    if (err) {
      res.redirect("/blogs");
    } else {
      res.render("edit", { blog: foundBlog });
    }
  });
});

// UPDATE ROUTE
// Needs method overrides because html only supports GET and POST, NOT PUT so we have to override the behaviour.
app.put("/blogs/:id", function(req, res) {
  // Access database, find by id, then update
  req.body.blog.body = req.sanitize(req.body.blog.body); // Sanitize bad html from user input
  Blog.findByIdAndUpdate(req.params.id, req.body.blog, function(
    err,
    updatedBlog
  ) {
    console.log("Updated blog : " + updatedBlog);
    if (err) {
      res.redirect("/blogs");
    } else {
      res.redirect("/blogs/" + req.params.id);
    }
  });
});

// DESTROY ROUTE!!!
// This can be a GET request with a different route. But we are using DELETE to follow RESTful routing.
app.delete("/blogs/:id", function(req, res) {
  // destroy blog
  Blog.findByIdAndRemove(req.params.id, function(err) {
    if (err) {
      res.redirect("/blogs");
      console.log("Nothing was deleted...");
    } else {
      res.redirect("/blogs");
    }
  });
});

// Listener
app.listen(8080, process.env.IP, function() {
  console.log("Server is running!");
  // console.log(process.env.PORT);
});
