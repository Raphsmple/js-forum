const express = require('express');
const path = require('path');
const multer = require('multer');
const router = express.Router();
const ctrl = require('./controllers');
const { requireAuth, optionalAuth } = require('./middleware');

const storage = multer.diskStorage({
    destination: path.join(__dirname, '..', 'client', 'uploads'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, '_'))
});
const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowed.includes(file.mimetype))
            return cb(new Error('Format non autorisé (JPEG, PNG, GIF uniquement)'));
        cb(null, true);
    }
});

// Auth
router.post('/auth/register', ctrl.register);
router.post('/auth/login', ctrl.login);
router.post('/auth/logout', ctrl.logout);
router.get('/auth/me', requireAuth, ctrl.me);

// Categories
router.get('/categories', ctrl.getCategories);

// Posts
router.get('/posts', optionalAuth, ctrl.getPosts);
router.post('/posts', requireAuth, upload.single('image'), ctrl.createPost);
router.get('/posts/:id', optionalAuth, ctrl.getPost);
router.put('/posts/:id', requireAuth, ctrl.updatePost);
router.delete('/posts/:id', requireAuth, ctrl.deletePost);

// Comments
router.post('/posts/:id/comments', requireAuth, ctrl.createComment);
router.put('/comments/:id', requireAuth, ctrl.updateComment);
router.delete('/comments/:id', requireAuth, ctrl.deleteComment);

// Likes
router.post('/posts/:id/like', requireAuth, ctrl.likePost);
router.post('/comments/:id/like', requireAuth, ctrl.likeComment);

module.exports = router;
