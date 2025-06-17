const canvas = document.getElementById('editor-canvas');
const ctx = canvas.getContext('2d');
const imageLoader = document.getElementById('imageLoader');
const zoomSlider = document.getElementById('zoom');
const exportBtn = document.getElementById('export');
const applyBtn = document.getElementById('applyBtn');
const thumbnail = document.getElementById('thumbnail');

let img = new Image();
let dragging = false;
let resizing = false;
let dragOffsetX = 0, dragOffsetY = 0;
let imgX = 150, imgY = 150, imgW = 300, imgH = 300;
let scale = 1;
let resizeHandleSize = 10;
let activeHandle = null;

imageLoader.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (evt) => {
    thumbnail.src = evt.target.result;
    thumbnail.style.display = 'inline-block';
  };
  reader.readAsDataURL(file);
});

applyBtn.addEventListener('click', () => {
  if (!thumbnail.src) return;
  const temp = new Image();
  temp.onload = () => {
    img = temp;
    imgW = img.width * 0.5;
    imgH = img.height * 0.5;
    imgX = (canvas.width - imgW) / 2;
    imgY = (canvas.height - imgH) / 2;
    draw();
  };
  temp.src = thumbnail.src;
});

zoomSlider.addEventListener('input', () => {
  scale = parseFloat(zoomSlider.value);
  draw();
});

canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  activeHandle = getResizeHandle(mouseX, mouseY);
  if (activeHandle) {
    resizing = true;
  } else if (
    mouseX >= imgX && mouseX <= imgX + imgW * scale &&
    mouseY >= imgY && mouseY <= imgY + imgH * scale
  ) {
    dragging = true;
    dragOffsetX = mouseX - imgX;
    dragOffsetY = mouseY - imgY;
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (!img.src) return;
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  if (dragging) {
    imgX = mouseX - dragOffsetX;
    imgY = mouseY - dragOffsetY;
    draw();
  } else if (resizing && activeHandle) {
    if (activeHandle.includes('r')) {
      imgW = Math.max(10, (mouseX - imgX) / scale);
    }
    if (activeHandle.includes('b')) {
      imgH = Math.max(10, (mouseY - imgY) / scale);
    }
    if (activeHandle.includes('l')) {
      const newW = (imgX + imgW * scale - mouseX) / scale;
      imgX = mouseX;
      imgW = Math.max(10, newW);
    }
    if (activeHandle.includes('t')) {
      const newH = (imgY + imgH * scale - mouseY) / scale;
      imgY = mouseY;
      imgH = Math.max(10, newH);
    }
    draw();
  }
});

canvas.addEventListener('mouseup', () => {
  dragging = false;
  resizing = false;
  activeHandle = null;
});

canvas.addEventListener('mouseleave', () => {
  dragging = false;
  resizing = false;
  activeHandle = null;
});

function getResizeHandle(x, y) {
  const handles = {
    'tl': [imgX, imgY],
    'tr': [imgX + imgW * scale, imgY],
    'bl': [imgX, imgY + imgH * scale],
    'br': [imgX + imgW * scale, imgY + imgH * scale]
  };

  for (const key in handles) {
    const [hx, hy] = handles[key];
    if (Math.abs(x - hx) < resizeHandleSize && Math.abs(y - hy) < resizeHandleSize) {
      return key;
    }
  }
  return null;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, imgX, imgY, imgW * scale, imgH * scale);
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, 200, 0, Math.PI * 2);
  ctx.strokeStyle = "#0ff";
  ctx.lineWidth = 4;
  ctx.stroke();
  drawHandles();
}

function drawHandles() {
  ctx.fillStyle = "#0ff";
  const points = [
    [imgX, imgY],
    [imgX + imgW * scale, imgY],
    [imgX, imgY + imgH * scale],
    [imgX + imgW * scale, imgY + imgH * scale]
  ];
  for (const [x, y] of points) {
    ctx.fillRect(x - 5, y - 5, 10, 10);
  }
}

exportBtn.addEventListener('click', () => {
  const exportCanvas = document.createElement('canvas');
  const exportCtx = exportCanvas.getContext('2d');
  exportCanvas.width = 400;
  exportCanvas.height = 400;

  exportCtx.beginPath();
  exportCtx.arc(200, 200, 200, 0, Math.PI * 2);
  exportCtx.closePath();
  exportCtx.clip();

  // Calculate source cropping from image
  const cropX = (canvas.width / 2 - 200 - imgX) / scale;
  const cropY = (canvas.height / 2 - 200 - imgY) / scale;

  exportCtx.drawImage(
    img,
    cropX, cropY, 400 / scale, 400 / scale,
    0, 0, 400, 400
  );

  const link = document.createElement('a');
  link.download = 'ngks_pfp.png';
  link.href = exportCanvas.toDataURL();
  link.click();
});

