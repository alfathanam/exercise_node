const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const path = require("path");
const { check, validationResult } = require("express-validator");

const app = express();
const PORT = process.env.PORT || 3000;

// MySQL Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "belajar_mysql",
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log("Connected to MySQL database");
});

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Register User Endpoint - Render a form
app.get("/register", (req, res) => {
  res.render("register"); // Render the EJS template named 'register'
});

// Validation rules for registration
const validateRegistration = [
  check("username").notEmpty().withMessage("Username is required"),
  check("email").isEmail().withMessage("Invalid email address"),
  check("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

// Handle registration form submission with validation
app.post("/register", validateRegistration, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;

  try {
    // Hash password
    const hashedPassword = password; // 10 is the saltRounds value, higher means slower hashing but more secure

    // Insert user into database
    const query =
      "INSERT INTO users (username, password, email) VALUES (?, ?, ?)";
    db.query(query, [username, hashedPassword, email], (err, result) => {
      if (err) {
        console.error("Error registering user: " + err.message);
        res.status(500).send("Error registering user");
      } else {
        console.log("User registered successfully");
        res.redirect("/login"); // Redirect to login page after successful registration
      }
    });
  } catch (error) {
    console.error("Error hashing password: " + error.message);
    res.status(500).send("Error registering user");
  }
});

// Function to validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Login Route
app.get("/login", (req, res) => {
  res.render("login", { message: null });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  if (!isValidEmail(username)) {
    return res.render("login", { message: "Invalid email format" });
  }

  const sql = `SELECT * FROM users WHERE username = ? AND password = ?`;
  db.query(sql, [username, password], async (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (results.length > 0) {
      // User found
      //   return res.status(200).json({ message: "Login successful" });

      return res.render("profile", { message: "Login Succesful" });
    } else {
      // User not found or wrong credentials
      return res.render("login", { message: "Invalid username or password" });
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
