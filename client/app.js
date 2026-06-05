const button = document.getElementById("publishButton");
const postInput = document.getElementById("postInput");

button.addEventListener("click", () => {
    console.log(postInput.value);
});

