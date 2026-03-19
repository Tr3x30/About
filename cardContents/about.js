document.addEventListener('DOMContentLoaded', () => {
    resizeTitleName();
});

window.addEventListener('resize', () => {
    resizeTitleName();
});

function resizeTitleName() {
    const name = document.getElementById("name");
    const title = document.getElementById("title");

    if (!name || !title) {
        console.log("Missing element:", { name, title });
        return;
    }

    const computedName = window.getComputedStyle(name);
    const computedTitle = window.getComputedStyle(title);

    const px = (value) => parseFloat(value);

    name.style.fontSize = "20px";
    title.style.fontSize = "15px";

    let fontSize = px(computedName.fontSize);
    let maxWidth = name.parentElement.offsetWidth;
    let width = px(computedName.width);
    let scale = maxWidth / width;
    let windowH = window.innerHeight / 100;

    name.style.fontSize = `calc(${(fontSize * scale) / windowH}vh - 0.5px)`;

    fontSize = px(computedTitle.fontSize);
    maxWidth = title.parentElement.offsetWidth;
    width = px(computedTitle.width);
    scale = maxWidth / width;

    title.style.fontSize = `calc(${(fontSize * scale) / windowH}vh - 0.5px)`;
}