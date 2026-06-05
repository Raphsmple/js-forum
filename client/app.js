const button = document.getElementById("publishButton");
const postInput = document.getElementById("postInput");
const postsContainer = document.getElementById("postsContainer");


button.addEventListener("click", async () => {

    const text = postInput.value;

    await fetch("/posts", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ text })
    });

    const res = await fetch("/posts");
    const posts = await res.json();

    postsContainer.innerHTML = "";

    posts.forEach(post => {
        const div = document.createElement("div");
        div.innerText = post.text;
        postsContainer.appendChild(div);
    });
    
    postInput.value = "";
});