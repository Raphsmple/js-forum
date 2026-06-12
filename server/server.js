const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '..', 'client')));

app.use('/api', require('./routes'));

app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

app.use((err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE')
        return res.status(413).json({ error: 'Image trop grande (max 20 Mo)' });
    if (err.message && err.message.includes('Format'))
        return res.status(415).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur interne' });
});

app.use((req, res) => res.status(404).json({ error: 'Route introuvable' }));

app.listen(PORT, () => console.log(`Forum lancé sur http://localhost:${PORT}`));
