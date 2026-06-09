const express = require("express");
const app = express();
const db = require("./db");

app.use(express.json());

db.run(`
    CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        text TEXT
    )
`);

// GET posts
app.get("/posts", (req, res) => {
    db.all("SELECT * FROM posts", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// POST post
app.post("/posts", (req, res) => {
    const { username, text } = req.body;

    db.run(
        "INSERT INTO posts (username, text) VALUES (?, ?)",
        [username, text],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true, id: this.lastID });
        }
    );
});

app.use(express.static("client"));

app.listen(3000, () => {
    console.log("Serveur lancé sur http://localhost:3000");
});