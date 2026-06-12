const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const SALT_ROUNDS = 10;
const SESSION_HOURS = 24;

// ── AUTH ──────────────────────────────────────────────────────────────────────

exports.register = (req, res) => {
    const { email, username, password } = req.body;
    if (!email || !username || !password)
        return res.status(400).json({ error: 'Tous les champs sont obligatoires' });

    db.get(`SELECT id FROM users WHERE email = ?`, [email], (err, row) => {
        if (row) return res.status(409).json({ error: 'Email déjà utilisé' });

        bcrypt.hash(password, SALT_ROUNDS, (err, hash) => {
            if (err) return res.status(500).json({ error: 'Erreur serveur' });
            db.run(
                `INSERT INTO users (email, username, password) VALUES (?, ?, ?)`,
                [email, username, hash],
                function (err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.status(201).json({ message: 'Inscription réussie' });
                }
            );
        });
    });
};

exports.login = (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: 'Email et mot de passe requis' });

    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (err || !user) return res.status(401).json({ error: 'Identifiants invalides' });

        bcrypt.compare(password, user.password, (err, match) => {
            if (!match) return res.status(401).json({ error: 'Identifiants invalides' });

            // Supprimer l'ancienne session
            db.run(`DELETE FROM sessions WHERE user_id = ?`, [user.id], () => {
                const sessionId = uuidv4();
                const expires = new Date(Date.now() + SESSION_HOURS * 3600 * 1000)
                    .toISOString().replace('T', ' ').slice(0, 19);

                db.run(
                    `INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)`,
                    [sessionId, user.id, expires],
                    (err) => {
                        if (err) return res.status(500).json({ error: 'Erreur serveur' });
                        res.cookie('session', sessionId, {
                            httpOnly: true,
                            maxAge: SESSION_HOURS * 3600 * 1000,
                            sameSite: 'Strict'
                        });
                        res.json({ message: 'Connecté', username: user.username });
                    }
                );
            });
        });
    });
};

exports.logout = (req, res) => {
    const token = req.cookies && req.cookies.session;
    if (token) db.run(`DELETE FROM sessions WHERE id = ?`, [token]);
    res.clearCookie('session');
    res.json({ message: 'Déconnecté' });
};

exports.me = (req, res) => {
    res.json({ id: req.user.id, username: req.user.username, email: req.user.email });
};

// ── CATEGORIES ────────────────────────────────────────────────────────────────

exports.getCategories = (req, res) => {
    db.all(`SELECT * FROM categories ORDER BY name`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

// ── POSTS ─────────────────────────────────────────────────────────────────────

exports.getPosts = (req, res) => {
    const { category, my, liked } = req.query;
    const userId = req.user ? req.user.id : null;

    let query = `
        SELECT p.id, p.title, p.content, p.image_path, p.created_at,
               u.username, u.id as user_id,
               (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND type='like') as likes,
               (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND type='dislike') as dislikes,
               (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
               GROUP_CONCAT(DISTINCT c.name) as categories
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN post_categories pc ON p.id = pc.post_id
        LEFT JOIN categories c ON pc.category_id = c.id
    `;
    const params = [];

    if (category) {
        query += ` WHERE p.id IN (
            SELECT pc2.post_id FROM post_categories pc2
            JOIN categories c2 ON pc2.category_id = c2.id
            WHERE c2.id = ?
        )`;
        params.push(category);
    } else if (my && userId) {
        query += ` WHERE p.user_id = ?`;
        params.push(userId);
    } else if (liked && userId) {
        query += ` WHERE p.id IN (SELECT post_id FROM likes WHERE user_id = ? AND type='like')`;
        params.push(userId);
    }

    query += ` GROUP BY p.id ORDER BY p.created_at DESC`;

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        rows.forEach(r => { r.categories = r.categories ? r.categories.split(',') : []; });
        res.json(rows);
    });
};

exports.getPost = (req, res) => {
    const { id } = req.params;
    const userId = req.user ? req.user.id : null;

    db.get(`
        SELECT p.id, p.title, p.content, p.image_path, p.created_at,
               u.username, u.id as user_id,
               (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND type='like') as likes,
               (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND type='dislike') as dislikes,
               GROUP_CONCAT(DISTINCT c.name) as categories
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN post_categories pc ON p.id = pc.post_id
        LEFT JOIN categories c ON pc.category_id = c.id
        WHERE p.id = ?
        GROUP BY p.id
    `, [id], (err, post) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!post) return res.status(404).json({ error: 'Post introuvable' });

        post.categories = post.categories ? post.categories.split(',') : [];

        const userLikeQuery = userId
            ? `SELECT type FROM likes WHERE user_id = ? AND post_id = ?`
            : null;

        const fetchUserLike = (cb) => {
            if (!userLikeQuery) return cb(null);
            db.get(userLikeQuery, [userId, id], (e, r) => cb(r ? r.type : null));
        };

        fetchUserLike(userVote => {
            post.userVote = userVote;

            db.all(`
                SELECT c.id, c.content, c.created_at, u.username, u.id as user_id,
                       (SELECT COUNT(*) FROM likes WHERE comment_id = c.id AND type='like') as likes,
                       (SELECT COUNT(*) FROM likes WHERE comment_id = c.id AND type='dislike') as dislikes
                FROM comments c JOIN users u ON c.user_id = u.id
                WHERE c.post_id = ? ORDER BY c.created_at ASC
            `, [id], (err, comments) => {
                if (err) return res.status(500).json({ error: err.message });

                if (userId && comments.length > 0) {
                    const commentIds = comments.map(c => c.id);
                    db.all(
                        `SELECT comment_id, type FROM likes WHERE user_id = ? AND comment_id IN (${commentIds.map(() => '?').join(',')})`,
                        [userId, ...commentIds],
                        (e, votes) => {
                            const voteMap = {};
                            (votes || []).forEach(v => { voteMap[v.comment_id] = v.type; });
                            comments.forEach(c => { c.userVote = voteMap[c.id] || null; });
                            res.json({ ...post, comments });
                        }
                    );
                } else {
                    comments.forEach(c => { c.userVote = null; });
                    res.json({ ...post, comments });
                }
            });
        });
    });
};

exports.createPost = (req, res) => {
    const { title, content, categories } = req.body;
    if (!title || !content)
        return res.status(400).json({ error: 'Titre et contenu requis' });

    const imagePath = req.file ? '/uploads/' + req.file.filename : null;
    const cats = Array.isArray(categories) ? categories : (categories ? [categories] : []);

    db.run(
        `INSERT INTO posts (user_id, title, content, image_path) VALUES (?, ?, ?, ?)`,
        [req.user.id, title, content, imagePath],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            const postId = this.lastID;

            if (cats.length === 0) return res.status(201).json({ id: postId });

            const stmt = db.prepare(`INSERT OR IGNORE INTO post_categories (post_id, category_id) VALUES (?, ?)`);
            cats.forEach(catId => stmt.run(postId, catId));
            stmt.finalize(() => res.status(201).json({ id: postId }));
        }
    );
};

exports.updatePost = (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;

    db.get(`SELECT user_id FROM posts WHERE id = ?`, [id], (err, post) => {
        if (!post) return res.status(404).json({ error: 'Post introuvable' });
        if (post.user_id !== req.user.id) return res.status(403).json({ error: 'Interdit' });

        db.run(`UPDATE posts SET title = ?, content = ? WHERE id = ?`, [title, content, id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Post modifié' });
        });
    });
};

exports.deletePost = (req, res) => {
    const { id } = req.params;

    db.get(`SELECT user_id FROM posts WHERE id = ?`, [id], (err, post) => {
        if (!post) return res.status(404).json({ error: 'Post introuvable' });
        if (post.user_id !== req.user.id) return res.status(403).json({ error: 'Interdit' });

        db.run(`DELETE FROM posts WHERE id = ?`, [id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Post supprimé' });
        });
    });
};

// ── COMMENTS ──────────────────────────────────────────────────────────────────

exports.createComment = (req, res) => {
    const { id: postId } = req.params;
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Contenu requis' });

    db.get(`SELECT id FROM posts WHERE id = ?`, [postId], (err, post) => {
        if (!post) return res.status(404).json({ error: 'Post introuvable' });

        db.run(
            `INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)`,
            [postId, req.user.id, content],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.status(201).json({ id: this.lastID });
            }
        );
    });
};

exports.updateComment = (req, res) => {
    const { id } = req.params;
    const { content } = req.body;

    db.get(`SELECT user_id FROM comments WHERE id = ?`, [id], (err, comment) => {
        if (!comment) return res.status(404).json({ error: 'Commentaire introuvable' });
        if (comment.user_id !== req.user.id) return res.status(403).json({ error: 'Interdit' });

        db.run(`UPDATE comments SET content = ? WHERE id = ?`, [content, id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Commentaire modifié' });
        });
    });
};

exports.deleteComment = (req, res) => {
    const { id } = req.params;

    db.get(`SELECT user_id FROM comments WHERE id = ?`, [id], (err, comment) => {
        if (!comment) return res.status(404).json({ error: 'Commentaire introuvable' });
        if (comment.user_id !== req.user.id) return res.status(403).json({ error: 'Interdit' });

        db.run(`DELETE FROM comments WHERE id = ?`, [id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Commentaire supprimé' });
        });
    });
};

// ── LIKES ─────────────────────────────────────────────────────────────────────

function handleLike(req, res, postId, commentId) {
    const { type } = req.body;
    if (!['like', 'dislike'].includes(type))
        return res.status(400).json({ error: 'Type invalide' });

    const userId = req.user.id;

    db.get(
        `SELECT id, type FROM likes WHERE user_id = ? AND post_id IS ? AND comment_id IS ?`,
        [userId, postId, commentId],
        (err, existing) => {
            if (existing) {
                if (existing.type === type) {
                    db.run(`DELETE FROM likes WHERE id = ?`, [existing.id], () => {
                        res.json({ action: 'removed' });
                    });
                } else {
                    db.run(`UPDATE likes SET type = ? WHERE id = ?`, [type, existing.id], () => {
                        res.json({ action: 'changed' });
                    });
                }
            } else {
                db.run(
                    `INSERT INTO likes (user_id, post_id, comment_id, type) VALUES (?, ?, ?, ?)`,
                    [userId, postId, commentId, type],
                    (err) => {
                        if (err) return res.status(500).json({ error: err.message });
                        res.json({ action: 'added' });
                    }
                );
            }
        }
    );
}

exports.likePost = (req, res) => handleLike(req, res, parseInt(req.params.id), null);
exports.likeComment = (req, res) => handleLike(req, res, null, parseInt(req.params.id));
