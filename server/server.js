const express = require("express");
const app = express();

app.use(express.json());

let posts = [];

app.get("/posts", (req, res) => {
    res.json(posts);
});

app.post("/posts", (req, res) => {
    posts.push(req.body);
    res.json({ success: true });
});

app.use(express.static("client"));

app.listen(3000, () => {
    console.log("Serveur lancé sur http://localhost:3000");
});