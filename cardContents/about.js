document.addEventListener('DOMContentLoaded', () => {
    resizeTitleName();
});

window.addEventListener('resize', () => {
    resizeTitleName();
});

function resizeTitleName() {
    const name = document.getElementById("name");
    const computedName = window.getComputedStyle(name);

    const title = document.getElementById("title");
    const computedTitle = window.getComputedStyle(title);

    // helper to convert "123px" > 123
    const px = (value) => parseFloat(value);

    name.style.fontSize = "20px";
    title.style.fontSize = "15px";

    let fontSize = px(computedName.fontSize);
    let maxWidth = px(name.parentElement.offsetWidth);
    let width = px(computedName.width);
    let scale = maxWidth / width;
    console.log(`${maxWidth} / ${width} = ${scale}`);
    name.style.fontSize = `${Math.round(fontSize * scale)}px`;

    fontSize = px(computedTitle.fontSize);
    maxWidth = px(title.parentElement.offsetWidth);
    width = px(computedTitle.width);
    scale = maxWidth / width;
    title.style.fontSize = `${Math.round(fontSize * scale)}px`;
}