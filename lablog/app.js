var express = require("express");
var methodOverride = require("method-override");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var request = require("request");
var expressSanitizier = require("express-sanitizer");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");
var User = require("./models/user");

// APP CONFIG
// Connect to the databse
mongoose.connect("mongodb://localhost/blog-app", {
  useNewUrlParser: true
});
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true })); // Allows us to get the body of a post request
app.use(methodOverride("_method")); // Treat whatever the _method value is set to as the method type
app.use(bodyParser.urlencoded({ extended: true }));
// Set the session
app.use(
  require("express-session")({
    // secret to our session
    secret: "la flame",
    resave: false,
    saveUninitialized: false
  })
);
app.use(passport.initialize()); //REQUIRED for using passport
app.use(passport.session()); // REQUIRED for using passport
passport.use(new LocalStrategy(User.authenticate())); // Use loc-pass-mongoose's version of local strategy to authenticate

//Important for the passport module
// Responsible for reading session, takign the data from the session,
//  Decoding the encoded data from the session
//  Then encoding it again to put back into the session
passport.serializeUser(User.serializeUser()); // Putting data back to sessions
passport.deserializeUser(User.deserializeUser()); // Takes data from session

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
// var spotify_url =
//   "https://api.spotify.com/v1/search?q=abba&type=track&market=US";
// request(spotify_url, function(error, response, body) {
//   if (error) {
//     console.log("SOMETHING WENT WRONG!");
//     console.log(error);
//   } else {
//     if (response.statusCode == 200) {
//       console.log(body);
//     }
//   }
// });

//RESTFUL ROUTES
app.get("/", function(req, res) {
  res.redirect("/login");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/lablog",
    failureRedirect: "/login"
  }), // Authenticate credentials
  function(req, res) {}
);

app.get("/register", function(req, res) {
  res.render("register");
});

// REGISTERS A NEW USER!!!
app.post("/register", function(req, res) {
  //only add the username fro mthe req.body into the database
  // DO NOT want to save the password from req.body into database
  User.register(
    new User({ username: req.body.username }),
    req.body.password,
    function(err, user) {
      if (err) {
        console.log(err);
        return res.render("register"); // try again is error occurs
      }
      // log user in,
      // takes care of everything in the session.
      // runs the serializeUser method
      // specifies local strategy (instead of twitter and facebook)
      passport.authenticate("local")(req, res, function() {
        res.redirect("/lablog");
        // logs user in if no errors occur when trying to register
      });
    }
  );
  // res.redirect("/login");
});

//LOGOUT
app.get("/logout", function(req, res) {
  req.logout(); //method given my the passport module
  // passport destroys all user data in the current session
  res.redirect("/");
});

//middleware to check if user is logged in to access LA BLOG
// next is the next method to be called
function isLoggedIn(req, res, next) {
  // check if authenticated using a method from the passport module
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login"); // go back to login form if user is not logged in
}

// Routes once signed in
app.get("/lablog", isLoggedIn, function(req, res) {
  res.render("ThePrayer");
});

// Index route (Home page)
app.get("/blogs", isLoggedIn, function(req, res) {
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
app.get("/blogs/new", isLoggedIn, function(req, res) {
  res.render("new");
});

//CREATE ROUTE
app.post("/blogs", isLoggedIn, function(req, res) {
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
app.get("/blogs/:id", isLoggedIn, function(req, res) {
  Blog.findById(req.params.id, function(err, foundBlog) {
    if (err) {
      res.redirect("/blogs");
    } else {
      res.render("show", { blog: foundBlog });
    }
  });
});

// EDIT ROUTE
app.get("/blogs/:id/edit", isLoggedIn, function(req, res) {
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
app.put("/blogs/:id", isLoggedIn, function(req, res) {
  // Access database, find by id, then update
  req.body.blog.body = req.body.blog.body; // Sanitize bad html from user input
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
app.delete("/blogs/:id", isLoggedIn, function(req, res) {
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

// ANY SCREW UPS
app.get("/*", function(req, res) {
  res.render("invalidpage");
});
app.post("/*", function(req, res) {
  res.render("invalidpage");
});

// Listener
app.listen(8080, process.env.IP, function() {
  console.log("Server is running!");
  // console.log(process.env.PORT);
});
