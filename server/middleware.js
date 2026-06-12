const db = require('./db');

function requireAuth(req, res, next) {
    const token = req.cookies && req.cookies.session;
    if (!token) return res.status(401).json({ error: 'Non authentifié' });

    db.get(
        `SELECT s.user_id, u.username, u.email
         FROM sessions s JOIN users u ON s.user_id = u.id
         WHERE s.id = ? AND s.expires_at > datetime('now')`,
        [token],
        (err, row) => {
            if (err || !row) return res.status(401).json({ error: 'Session invalide ou expirée' });
            req.user = { id: row.user_id, username: row.username, email: row.email };
            next();
        }
    );
}

function optionalAuth(req, res, next) {
    const token = req.cookies && req.cookies.session;
    if (!token) { req.user = null; return next(); }

    db.get(
        `SELECT s.user_id, u.username, u.email
         FROM sessions s JOIN users u ON s.user_id = u.id
         WHERE s.id = ? AND s.expires_at > datetime('now')`,
        [token],
        (err, row) => {
            req.user = row ? { id: row.user_id, username: row.username, email: row.email } : null;
            next();
        }
    );
}

module.exports = { requireAuth, optionalAuth };
