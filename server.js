const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");

// Lisää ylös server.js-tiedoston alkuun:
const voteData = {}; // id: { right: number, left: number }


const app = express();
app.use(cors());
app.use("/uploads", express.static("uploads"));

if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("./uploads");
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const id = uuidv4();
    cb(null, id + ext);
  },
});
const upload = multer({ storage });

app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");

  const id = path.basename(req.file.filename, path.extname(req.file.filename));
  res.json({ id });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Hakee kuvan ja äänet ID:llä
app.get("/image/:id", (req, res) => {
    const id = req.params.id;
    const files = fs.readdirSync("uploads/");
    const found = files.find((file) => file.startsWith(id));
  
    if (!found) {
      return res.status(404).json({ error: "Image not found" });
    }
  
    const votes = voteData[id] || { right: 0, left: 0 };
    const total = votes.right + votes.left;
    const percentage = total > 0 ? Math.round((votes.right / total) * 100) : null;
  
    res.json({
      id,
      url: `https://image-backend-giso.onrender.com/uploads/${found}`, //https://image-backend-k3uq.onrender.com
      votes,
      percentage,
    });
  });
  
  app.post("/vote", express.json(), (req, res) => {
    const { id, direction } = req.body;
    if (!id || !["left", "right"].includes(direction)) {
      return res.status(400).json({ error: "Invalid vote data" });
    }
  
    if (!voteData[id]) {
      voteData[id] = { left: 0, right: 0 };
    }
  
    voteData[id][direction]++;
    res.json({ success: true });
  });

  app.get("/random-image", (req, res) => {
    const files = fs.readdirSync("uploads/");
    if (files.length === 0) return res.status(404).json({ error: "No images available" });
  
    const randomFile = files[Math.floor(Math.random() * files.length)];
    const id = path.basename(randomFile, path.extname(randomFile));
  
    res.json({
  id,
  url: `https://image-backend-giso.onrender.com/uploads/${randomFile}`, 
});
  });

app.get("/vote-result/:id", (req, res) => {
  const id = req.params.id;
  const votes = voteData[id];

  if (!votes) {
    return res.status(404).json({ error: "No votes found for image" });
  }

  const totalVotes = votes.left + votes.right;
  res.json({
    positiveVotes: votes.right,
    totalVotes,
  });
});

  
