for (const element of document.getElementsByTagName("li")) {
    element.addEventListener("mouseenter", () => {
        element.style.color = "#FFFFFF";
    });
    element.addEventListener("mouseleave", () => {
        element.style.color = "#b3b3b3";
    });
}
const favicon = document.getElementById("favicon");
const canvas = document.createElement("canvas");
canvas.width = 16;
canvas.height = 16;
const context = canvas.getContext("2d");
let progress = 0;
context.clearRect(0, 0, 16, 16);
context.fillStyle = "#FFFFFF";
context.font = "16px Consolas";
const title = "IDE ";
const size = context.measureText("|");
function DrawNext() {
    context.clearRect(0, 0, 16, 16);
    context.fillText(title[progress], (16 - size.width) / 2, size.actualBoundingBoxAscent);
    progress = (progress + 1) % title.length;
    favicon.href = canvas.toDataURL("image/png");
}
DrawNext();
setInterval(DrawNext, 1000);
export {};
//# sourceMappingURL=index.js.map