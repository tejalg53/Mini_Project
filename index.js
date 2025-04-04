const express = require('express');
const multer = require('multer');
const path = require('path');
const mysql = require('mysql2');
const app = express();
const port = 3001;

// Middleware to parse URL-encoded and JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set up Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Make sure the 'uploads' directory exists
  },
  filename: function (req, file, cb) {
    // Prepend timestamp to filename to avoid duplicates
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// File filter to allow only specific file types
const fileFilter = (req, file, cb) => {
  // Allowed file extensions: .pdf, .doc, .docx, .jpg, .jpeg
  const filetypes = /pdf|doc|docx|jpg|jpeg/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  if (extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: File type not allowed!'));
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// Create MySQL connection pool (update with your credentials)
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Project@2025',
  database: 'mess_feedback',
});

// Set session SQL mode to avoid warnings being treated as errors
pool.query("SET SESSION sql_mode='NO_ENGINE_SUBSTITUTION'", (err) => {
  if (err) {
    console.error("Error setting SQL mode:", err);
  } else {
    console.log("SQL mode set successfully.");
  }
});
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); // Allowed HTTP methods
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Allowed headers
  next();
});


// Endpoint to handle feedback submission
app.post('/submit', upload.single('proof_file'), (req, res) => {
  const {
    reg_no,
    name,
    block,
    room_no,
    mess_name,
    mess_type,
    feedback_type,
    category,
    comments
  } = req.body;
  
  let proofFilePath = null;
  if (req.file) {
    proofFilePath = req.file.path; // Store the file path
  }
  // Insert data into the database
  const sql = `INSERT INTO mess_feedbacks 
    (reg_no, name, block, room_no, mess_name, mess_type, feedback_type, category, comments, proof_file_path)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  pool.query(sql, [reg_no, name, block, room_no, mess_name, mess_type, feedback_type, category, comments, proofFilePath], (err, results) => {
    if (err) {
      console.error("Error inserting feedback:", err);
      return res.status(500).json({ error: "Database insertion error" });
    }
    res.status(200).json({ message: "Feedback submitted successfully!" });
  });
});

// Serve static files from the uploads folder (optional)
app.use('/uploads', express.static('uploads'));

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:3001`);
});