const express = require("express");
const cors = require("cors");

require("./config/db"); // connect PostgreSQL

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("BodyPose Analyzer Backend Running");
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});