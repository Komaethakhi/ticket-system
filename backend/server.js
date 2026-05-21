const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://myherbalife.mi27.in"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  }
}));
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/events", require("./routes/events"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/ticket", require("./routes/ticket"));

const frontendBuildPath = path.join(__dirname, "../frontend/build");

app.use(express.static(frontendBuildPath));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(frontendBuildPath, "index.html"));
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
