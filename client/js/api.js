const API = {
    async req(method, url, body, isForm) {
        const opts = { method, credentials: 'include' };
        if (body) {
            if (isForm) { opts.body = body; }
            else { opts.headers = { 'Content-Type': 'application/json' }; opts.body = JSON.stringify(body); }
        }
        const res = await fetch('/api' + url, opts);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
        return data;
    },
    get: (url) => API.req('GET', url),
    post: (url, body) => API.req('POST', url, body),
    postForm: (url, form) => API.req('POST', url, form, true),
    put: (url, body) => API.req('PUT', url, body),
    delete: (url) => API.req('DELETE', url),

    me() { return API.get('/auth/me'); },
    login(email, password) { return API.post('/auth/login', { email, password }); },
    register(username, email, password) { return API.post('/auth/register', { username, email, password }); },
    logout() { return API.post('/auth/logout'); },

    getPosts(params = {}) {
        const q = new URLSearchParams(params).toString();
        return API.get('/posts' + (q ? '?' + q : ''));
    },
    getPost(id) { return API.get('/posts/' + id); },
    createPost(form) { return API.postForm('/posts', form); },
    updatePost(id, data) { return API.put('/posts/' + id, data); },
    deletePost(id) { return API.delete('/posts/' + id); },

    createComment(postId, content) { return API.post('/posts/' + postId + '/comments', { content }); },
    updateComment(id, content) { return API.put('/comments/' + id, { content }); },
    deleteComment(id) { return API.delete('/comments/' + id); },

    likePost(id, type) { return API.post('/posts/' + id + '/like', { type }); },
    likeComment(id, type) { return API.post('/comments/' + id + '/like', { type }); },

    getCategories() { return API.get('/categories'); }
};

function timeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60) return 'à l\'instant';
    if (diff < 3600) return `il y a ${Math.floor(diff/60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff/3600)} h`;
    return `il y a ${Math.floor(diff/86400)} j`;
}

function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
