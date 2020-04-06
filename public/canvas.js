const canvas = $("canvas");
const ctx = canvas.get(0).getContext("2d");
let sign = canvas.get(0);

let painting = false;

function startPosition(e) {
    painting = true;
    ctx.beginPath();
    draw(e);
}
function finishedPosition() {
    painting = false;
    ctx.beginPath();
    var signData = sign.toDataURL();
    $("input[name='sign']").val(signData);
}

function draw(e) {
    if (!painting) return;
    ctx.lineWidth = 3;
    ctx.strokeStyle = "white";
    ctx.lineCap = "round";
    // ctx.strokeStyle = "white";
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
}
canvas.on("mousedown", startPosition);
canvas.on("mouseup", finishedPosition);
canvas.on("mousemove", draw);
