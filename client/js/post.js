let currentUser = null;
let post = null;
const postId = new URLSearchParams(location.search).get('id');

if (!postId) window.location.href = '/';

async function init() {
    try { currentUser = await API.me(); } catch (_) {}
    updateNav();
    await loadPost();
}

function updateNav() {
    const nav = document.getElementById('navActions');
    if (currentUser) {
        nav.innerHTML = `
            <span class="nav-user">${FX.avatarHTML(currentUser.username, true)} ${escHtml(currentUser.username)}</span>
            <button class="btn btn-outline" onclick="doLogout()">Déconnexion</button>`;
    }
}
async function doLogout() { await API.logout().catch(() => {}); window.location.reload(); }

async function loadPost() {
    try {
        post = await API.getPost(postId);
        renderPost();
        renderComments();
        if (currentUser) {
            document.getElementById('commentForm').classList.remove('hidden');
        } else {
            document.getElementById('loginPrompt').classList.remove('hidden');
        }
    } catch (e) {
        document.getElementById('postDetail').innerHTML = `<p class="error-msg">${e.message}</p>`;
    }
}

function renderPost() {
    const tags = post.categories.map(c => `<span class="tag">${escHtml(c)}</span>`).join('');
    const img = post.image_path ? `<img class="post-detail-image" src="${escHtml(post.image_path)}" alt="Illustration du post">` : '';
    const isOwner = currentUser && currentUser.id === post.user_id;
    const ownerBtns = isOwner ? `
        <button class="btn btn-outline btn-sm" onclick="editPost()">Modifier</button>
        <button class="btn btn-danger btn-sm" onclick="deletePost()">Supprimer</button>` : '';

    const detail = document.getElementById('postDetail');
    detail.style.cssText += FX.gradientVars(post.username + '#' + post.id);
    detail.innerHTML = `
        ${img}
        <div class="post-meta">
            ${FX.avatarHTML(post.username)}
            <span class="post-author">${escHtml(post.username)}</span>
            <span class="post-time">${timeAgo(post.created_at)}</span>
        </div>
        ${tags ? `<div class="tags" style="margin-bottom:.75rem">${tags}</div>` : ''}
        <h1>${escHtml(post.title)}</h1>
        <p class="post-detail-content" style="margin-top:.75rem">${escHtml(post.content)}</p>
        <div class="post-footer" style="margin-top:1rem">
            <button class="vote-btn ${post.userVote==='like'?'active-like':''}" id="likeBtn" aria-label="J'aime" onclick="votePost('like')">${FX.icon('like')} <span id="likeCount">${post.likes}</span></button>
            <button class="vote-btn ${post.userVote==='dislike'?'active-dislike':''}" id="dislikeBtn" aria-label="Je n'aime pas" onclick="votePost('dislike')">${FX.icon('dislike')} <span id="dislikeCount">${post.dislikes}</span></button>
        </div>
        <div class="post-actions">${ownerBtns}</div>`;
}

function renderComments() {
    const list = document.getElementById('commentsList');
    if (!post.comments.length) { list.innerHTML = '<p style="color:var(--muted);font-size:.9rem;padding-top:.5rem">// Aucun commentaire — sois le premier à transmettre.</p>'; return; }
    list.innerHTML = post.comments.map(c => {
        const isOwner = currentUser && currentUser.id === c.user_id;
        return `
        <div class="comment" id="comment-${c.id}">
            <div class="comment-meta">
                ${FX.avatarHTML(c.username, true)}
                <span class="comment-author">${escHtml(c.username)}</span>
                <span>${timeAgo(c.created_at)}</span>
            </div>
            <div class="comment-content" id="comment-text-${c.id}">${escHtml(c.content)}</div>
            <div class="comment-actions">
                <button class="vote-btn ${c.userVote==='like'?'active-like':''}" aria-label="J'aime" onclick="voteComment(${c.id},'like',this)">${FX.icon('like')} <span>${c.likes}</span></button>
                <button class="vote-btn ${c.userVote==='dislike'?'active-dislike':''}" aria-label="Je n'aime pas" onclick="voteComment(${c.id},'dislike',this)">${FX.icon('dislike')} <span>${c.dislikes}</span></button>
                ${isOwner ? `
                    <button class="btn btn-outline btn-sm" onclick="editComment(${c.id})">Modifier</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteComment(${c.id})">Supprimer</button>` : ''}
            </div>
        </div>`;
    }).join('');
}

async function votePost(type) {
    if (!currentUser) { window.location.href = '/login.html'; return; }
    try { await API.likePost(postId, type); await loadPost(); }
    catch (e) { alert(e.message); }
}

async function voteComment(id, type) {
    if (!currentUser) { window.location.href = '/login.html'; return; }
    try { await API.likeComment(id, type); await loadPost(); }
    catch (e) { alert(e.message); }
}

async function submitComment() {
    const input = document.getElementById('commentInput');
    if (!input.value.trim()) return;
    try {
        await API.createComment(postId, input.value.trim());
        input.value = '';
        await loadPost();
    } catch (e) { alert(e.message); }
}

async function deletePost() {
    if (!confirm('Supprimer ce post ?')) return;
    try { await API.deletePost(postId); window.location.href = '/'; }
    catch (e) { alert(e.message); }
}

function editPost() {
    const newTitle = prompt('Nouveau titre :', post.title);
    if (newTitle === null) return;
    const newContent = prompt('Nouveau contenu :', post.content);
    if (newContent === null) return;
    API.updatePost(postId, { title: newTitle, content: newContent })
        .then(() => loadPost())
        .catch(e => alert(e.message));
}

async function editComment(id) {
    const el = document.getElementById('comment-text-' + id);
    const newContent = prompt('Modifier le commentaire :', el.textContent);
    if (newContent === null) return;
    try { await API.updateComment(id, newContent); await loadPost(); }
    catch (e) { alert(e.message); }
}

async function deleteComment(id) {
    if (!confirm('Supprimer ce commentaire ?')) return;
    try { await API.deleteComment(id); await loadPost(); }
    catch (e) { alert(e.message); }
}

init();
