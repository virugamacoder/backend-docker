const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.json({
    message: "Node API running with Docker 🚀 CI CD Github Push Test"
  });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});