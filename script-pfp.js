
const canvas = document.getElementById('preview-canvas');
const ctx = canvas.getContext('2d');
const imgUpload = document.getElementById('imgUpload');
const zoomSlider = document.getElementById('zoom');
const exportBtn = document.getElementById('exportBtn');

let img = new Image();
let imgX = 100, imgY = 100, imgW = 400, imgH = 400;
let isDragging = false;
let dragOffsetX = 0, dragOffsetY = 0;
let zoom = 1;

imgUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (evt) {
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  }
});

img.onload = () => draw();

zoomSlider.addEventListener('input', () => {
  zoom = parseFloat(zoomSlider.value);
  draw();
});

canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  if (mouseX >= imgX && mouseX <= imgX + imgW && mouseY >= imgY && mouseY <= imgY + imgH) {
    isDragging = true;
    dragOffsetX = mouseX - imgX;
    dragOffsetY = mouseY - imgY;
  }
});

canvas.addEventListener('mouseup', () => isDragging = false);
canvas.addEventListener('mouseout', () => isDragging = false);
canvas.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const rect = canvas.getBoundingClientRect();
    imgX = e.clientX - rect.left - dragOffsetX;
    imgY = e.clientY - rect.top - dragOffsetY;
    draw();
  }
});

exportBtn.addEventListener('click', () => {
  const exportCanvas = document.createElement('canvas');
  const exportCtx = exportCanvas.getContext('2d');
  exportCanvas.width = 400;
  exportCanvas.height = 400;
  exportCtx.beginPath();
  exportCtx.arc(200, 200, 200, 0, Math.PI * 2);
  exportCtx.closePath();
  exportCtx.clip();
  exportCtx.drawImage(canvas, imgX, imgY, imgW * zoom, imgH * zoom, 0, 0, 400, 400);
  const link = document.createElement('a');
  link.download = 'ngks_pfp.png';
  link.href = exportCanvas.toDataURL();
  link.click();
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, imgX, imgY, imgW * zoom, imgH * zoom);
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, 400, 0, Math.PI * 2);
  ctx.strokeStyle = "#0ff";
  ctx.lineWidth = 5;
  ctx.stroke();
}
