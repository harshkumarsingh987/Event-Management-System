import bcrypt from "bcrypt"; // For password hashing
import cors from "cors";
import ejsMate from "ejs-mate";
import express from "express";
import session from "express-session"; // For managing sessions
import methodOverride from "method-override";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import Event from "./models/event.js";
import User from "./models/user.js"; // Import User Model

// Fix for __dirname issue
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Views Directory:", path.join(__dirname, "views"));
const server = express();

// MongoDB Connection


mongoose.connect("mongodb://127.0.0.1:27017/event-management", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("✅ MongoDB Connected");
}).catch((err) => {
  console.error("❌ MongoDB Connection Error:", err);
});

// Middleware setup
server.engine("ejs", ejsMate);
server.set("view engine", "ejs");
server.set("views", path.join(__dirname, "views"));
server.use(express.urlencoded({ extended: true }));
server.use(express.json());
server.use(methodOverride("_method"));
server.use(express.static(path.join(__dirname, "public")));
server.use(cors());

// Session Middleware
server.use(
  session({
    secret: "your_secret_key", // Replace with a strong secret key
    resave: false, // Avoids resaving unchanged sessions
    saveUninitialized: true, // Saves new but unmodified sessions
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 }, // Session expires in 1 day
  })
);


// Error handler middleware
server.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// ✅ Authentication Middleware
const requireAuth = (req, res) => {
  //console.log("🔍 Checking User Session:", req.session.user); // Debugging ke liye
  if (!req.session.user) {
    console.log("❌ User not logged in, redirecting to /login");
    return res.redirect("/login");
  }

 // res.render("login")

};


// ✅ Show all events (Homepage)
server.get("/", async (req, res) => {
  try {
    const allEvents = await Event.find({});
    console.log("✅ Retrieved Events:", allEvents); // Debugging
    res.render("index", { allEvents, user: req.session.user });
  } catch (error) {
    console.error("❌ Error Fetching Events:", error);
    res.status(500).send("Internal Server Error");
  }
});


// ✅ Delete an event (only if logged in)
server.delete("/events/:id",  async (req, res) => {
  requireAuth(req,res);
  const { id } = req.params;
  await Event.findByIdAndDelete(id);
  res.redirect("/");
});

// ✅ Show details of a specific event
server.get("/events/:id/view", async (req, res) => {
  requireAuth(req,res);
  const { id } = req.params;
  const event = await Event.findById(id);
  res.render("show", { event });
});

// ✅ Form to edit an event (only if logged in)
server.get("/events/:id/edit", async (req, res) => {
  requireAuth(req,res);
  const { id } = req.params;
  console.log("🔍 Edit Event Route Accessed for ID:", id);
  const event = await Event.findById(id);
  if (!event) {
    console.log("❌ Event Not Found!");
    return res.status(404).send("Event not found");
  }

  console.log("✅ Event Data:", event);
  res.render("edit", { event });
});
  


// ✅ Form to create a new event (only if logged in)
server.get("/events/new", (req, res) => {
  console.log(req);
  requireAuth(req,res);
  console.log("🔍 Checking User Session:", req.session.user);
  //res.send("jjj")
   res.render("new");
});




// ✅ Create a new event (only if logged in)
server.post("/events", async (req, res) => {
  try { requireAuth(req,res);
    console.log("🔍 New Event Data:", req.body);

    // Ensure request body has required fields
    if (!req.body.name || !req.body.date || !req.body.location || !req.body.description) {
      return res.status(400).send("All fields are required.");
    }

    // Create and save the eventreq.body)
     console.log(req.body);
    const newEvent = new Event(req.body);
    await newEvent.save();

    console.log("✅ Event Saved:", newEvent);
    res.redirect("/");
  } catch (error) {
    console.error("❌ Event Save Error:", error.message);
    res.status(500).send("Internal Server Error");
  }
});



// ✅ Update an event (only if logged in)
server.put("/events/:id",  async (req, res) => {
  requireAuth(req,res);
  const { id } = req.params;
  await Event.findByIdAndUpdate(id, { ...req.body });
  res.redirect(`/events/${id}`);
});

server.get("/test-session", (req, res) => {
  console.log("🔍 Session Data:", req.session);
  res.send(req.session);
});



// ✅ Render Login Page
server.get("/login", (req, res) => {
  res.render("login");
});

// ✅ Handle Login Form Submission
server.post("/login", async (req, res) => { 
  const { email, password } = req.body;
  
  console.log("🔍 Login Attempt:", { email, password });

  const user = await User.findOne({ email });
  console.log("🔍 User Found in DB:", user);

  if (!user) {
    console.log("❌ User not found!");
    return res.send("Invalid email or password. <a href='/login'>Try Again</a>");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  console.log("🔍 Password Match Status:", isMatch);

  if (!isMatch) {
    console.log("❌ Incorrect Password!");
    return res.send("Invalid email or password. <a href='/login'>Try Again</a>");
  }

  req.session.user = { _id: user._id, name: user.name, email: user.email }; // ✅ Only store required data
  console.log("✅ User logged in:", req.session.user);

  res.redirect("/");
});


// ✅ Logout Route
server.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// ✅ Render Signup Page
server.get("/signup", (req, res) => {
  res.render("signup");
});

// ✅ Handle Signup Form Submission
server.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  console.log("🔍 Signup Data:", { name, email, password });

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    console.log("❌ Email already exists!");
    return res.send("Email already registered. <a href='/signup'>Try Again</a>");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  console.log("🔍 Hashed Password:", hashedPassword);

  const newUser = new User({ name, email, password: hashedPassword });
  await newUser.save();
  console.log("✅ User Registered:", newUser);

  req.session.user = { _id: newUser._id, name: newUser.name, email: newUser.email };
  res.redirect("/");
});


// ✅ Protected Dashboard Route
server.get("/dashboard", (req, res) => {
  requireAuth(req,res);
  console.log("========")
  console.log(req.session.user);
  res.send(`Welcome ${req.session.user.name}, to your dashboard!`);
})



// Start the server
server.listen(5000, () => {
  console.log("✅ Server is running on port 5000");
});
