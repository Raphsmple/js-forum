let currentUser = null;
let allCategories = [];
let activeFilter = { type: 'all', value: null };

async function init() {
    try { currentUser = await API.me(); } catch (_) {}
    updateNav();
    allCategories = await API.getCategories();
    renderCategoryFilters();
    if (currentUser) {
        document.getElementById('newPostBtn').style.display = '';
        document.getElementById('myPostsFilter').style.display = '';
        document.getElementById('likedPostsFilter').style.display = '';
        renderCategoryCheckboxes();
    }
    await loadPosts();
}

function updateNav() {
    const nav = document.getElementById('navActions');
    if (currentUser) {
        nav.innerHTML = `
            <span class="nav-user">${FX.avatarHTML(currentUser.username, true)} ${escHtml(currentUser.username)}</span>
            <button class="btn btn-outline" onclick="doLogout()">Déconnexion</button>`;
    }
}

async function doLogout() {
    await API.logout().catch(() => {});
    window.location.reload();
}

function renderCategoryFilters() {
    const list = document.getElementById('categoryList');
    list.innerHTML = allCategories.map(c =>
        `<li><a href="#" class="filter-link" data-filter="category" data-id="${c.id}">${escHtml(c.name)}</a></li>`
    ).join('');
    list.querySelectorAll('.filter-link').forEach(el => el.addEventListener('click', onFilterClick));
}

function renderCategoryCheckboxes() {
    const box = document.getElementById('categoryCheckboxes');
    if (!box) return;
    box.innerHTML = allCategories.map(c =>
        `<label><input type="checkbox" name="categories" value="${c.id}"> ${escHtml(c.name)}</label>`
    ).join('');
}

document.querySelectorAll('.filter-link[data-filter]').forEach(el => el.addEventListener('click', onFilterClick));

function onFilterClick(e) {
    e.preventDefault();
    document.querySelectorAll('.filter-link').forEach(l => l.classList.remove('active'));
    e.target.classList.add('active');
    const f = e.target.dataset.filter;
    const id = e.target.dataset.id;
    activeFilter = { type: f, value: id };
    const titles = { all: 'Tous les posts', my: 'Mes posts', liked: 'Posts aimés' };
    document.getElementById('postsTitle').textContent = titles[f] || ('Catégorie : ' + e.target.textContent);
    loadPosts();
}

async function loadPosts() {
    const container = document.getElementById('postsContainer');
    container.innerHTML = FX.loaderHTML('Chargement du flux…');
    try {
        const params = {};
        if (activeFilter.type === 'category') params.category = activeFilter.value;
        else if (activeFilter.type === 'my') params.my = 'true';
        else if (activeFilter.type === 'liked') params.liked = 'true';
        const posts = await API.getPosts(params);
        document.dispatchEvent(new CustomEvent('posts:loaded', { detail: { posts } }));
        if (posts.length === 0) { container.innerHTML = '<p class="loading">// Aucun signal détecté</p>'; return; }
        container.innerHTML = posts.map(renderPostCard).join('');
    } catch (e) { container.innerHTML = `<p class="error-msg">${e.message}</p>`; }
}

function renderPostCard(p) {
    const tags = p.categories.map(c => `<span class="tag">${escHtml(c)}</span>`).join('');
    const img = p.image_path ? `<div class="post-image-wrap"><img class="post-image" src="${escHtml(p.image_path)}" alt="Illustration du post" loading="lazy"></div>` : '';
    const excerpt = p.content.length > 150 ? escHtml(p.content.slice(0, 150)) + '…' : escHtml(p.content);
    return `
    <article class="post-card" style="${FX.gradientVars(p.username + '#' + p.id)}">
        <a href="/post.html?id=${p.id}" class="post-card-link">
            ${img}
            <div class="post-meta">
                ${FX.avatarHTML(p.username)}
                <span class="post-author">${escHtml(p.username)}</span>
                <span class="post-time">${timeAgo(p.created_at)}</span>
            </div>
            <div class="post-title">${escHtml(p.title)}</div>
            <div class="post-excerpt">${excerpt}</div>
            ${tags ? `<div class="tags">${tags}</div>` : ''}
        </a>
        <div class="post-footer">
            <button class="vote-btn ${p.userVote==='like'?'active-like':''}" aria-label="J'aime" onclick="votePost(${p.id},'like',this)">${FX.icon('like')} ${p.likes}</button>
            <button class="vote-btn ${p.userVote==='dislike'?'active-dislike':''}" aria-label="Je n'aime pas" onclick="votePost(${p.id},'dislike',this)">${FX.icon('dislike')} ${p.dislikes}</button>
            <span class="comment-count">${FX.icon('comment')} ${p.comment_count}</span>
        </div>
    </article>`;
}

async function votePost(id, type, btn) {
    if (!currentUser) { window.location.href = '/login.html'; return; }
    try {
        await API.likePost(id, type);
        await loadPosts();
    } catch (e) { alert(e.message); }
}

// ── Nouveau post ──
function openPostModal() {
    document.getElementById('postModal').classList.remove('hidden');
    renderCategoryCheckboxes();
}
function closePostModal() {
    document.getElementById('postModal').classList.add('hidden');
    document.getElementById('postForm').reset();
    document.getElementById('postError').textContent = '';
}

document.getElementById('postForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = document.getElementById('postError');
    err.textContent = '';
    const form = new FormData();
    form.append('title', document.getElementById('postTitle').value);
    form.append('content', document.getElementById('postContent').value);
    const imgFile = document.getElementById('postImage').files[0];
    if (imgFile) form.append('image', imgFile);
    document.querySelectorAll('input[name="categories"]:checked').forEach(c => form.append('categories', c.value));
    try {
        await API.createPost(form);
        closePostModal();
        await loadPosts();
    } catch (e) { err.textContent = e.message; }
});

document.getElementById('postModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('postModal')) closePostModal();
});

init();
