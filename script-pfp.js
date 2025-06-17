const canvas = document.getElementById('editor-canvas');
const ctx = canvas.getContext('2d');
function resizeCanvasToWindow() {
  canvas.width = window.innerWidth * 0.95;
  canvas.height = window.innerHeight * 0.85;
  drawAll();
}
window.addEventListener('resize', resizeCanvasToWindow);
resizeCanvasToWindow(); // Initial run

const imageLoader = document.getElementById('imageLoader');
const thumbnailBar = document.getElementById('thumbnail-bar');
const zoomSlider = document.getElementById('zoom');
const exportBtn = document.getElementById('export');
const deleteBtn = document.getElementById('delete');

let placedImages = [];
let activeImage = null;

imageLoader.addEventListener('change', (e) => {
  [...e.target.files].forEach(file => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const thumb = document.createElement('img');
        thumb.src = img.src;
        thumb.onclick = () => {
          const newImg = {
            img: img,
            x: 300, y: 300,
            width: 200, height: 200,
            scale: 1,
            dragging: false,
            resizing: false,
            activeHandle: null,
            offsetX: 0,
            offsetY: 0
          };
          placedImages.push(newImg);
          activeImage = newImg;
          drawAll();
        };
        thumbnailBar.appendChild(thumb);
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  });
});

function drawAll() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  placedImages.forEach(item => {
    ctx.drawImage(item.img, item.x, item.y, item.width * item.scale, item.height * item.scale);
    if (item === activeImage) drawHandles(item);
  });
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, 200, 0, Math.PI * 2);
  ctx.strokeStyle = "#0ff";
  ctx.lineWidth = 4;
  ctx.stroke();
}

function drawHandles(item) {
  const x = item.x;
  const y = item.y;
  const w = item.width * item.scale;
  const h = item.height * item.scale;
  const points = [
    [x, y], [x + w / 2, y], [x + w, y],
    [x, y + h / 2], [x + w, y + h / 2],
    [x, y + h], [x + w / 2, y + h], [x + w, y + h]
  ];
  ctx.fillStyle = "#0ff";
  points.forEach(([px, py]) => ctx.fillRect(px - 5, py - 5, 10, 10));
}

canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  activeImage = null;
  for (let i = placedImages.length - 1; i >= 0; i--) {
    const item = placedImages[i];
    const x = item.x;
    const y = item.y;
    const w = item.width * item.scale;
    const h = item.height * item.scale;

    const handles = {
      'tl': [x, y], 'tm': [x + w / 2, y], 'tr': [x + w, y],
      'ml': [x, y + h / 2], 'mr': [x + w, y + h / 2],
      'bl': [x, y + h], 'bm': [x + w / 2, y + h], 'br': [x + w, y + h]
    };

    for (const [handle, [hx, hy]] of Object.entries(handles)) {
      if (Math.abs(mx - hx) < 10 && Math.abs(my - hy) < 10) {
        activeImage = item;
        item.activeHandle = handle;
        item.resizing = true;
        drawAll();
        return;
      }
    }

    if (mx >= x && mx <= x + w && my >= y && my <= y + h) {
      activeImage = item;
      item.dragging = true;
      item.offsetX = mx - x;
      item.offsetY = my - y;
      drawAll();
      return;
    }
  }

  drawAll();
});

canvas.addEventListener('mousemove', (e) => {
  if (!activeImage) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  if (activeImage.dragging) {
    activeImage.x = mx - activeImage.offsetX;
    activeImage.y = my - activeImage.offsetY;
    drawAll();
  }

  if (activeImage.resizing && activeImage.activeHandle) {
    const img = activeImage;
    const ax = img.x;
    const ay = img.y;
    const w = img.width * img.scale;
    const h = img.height * img.scale;
    const handle = img.activeHandle;

    const resize = (dx, dy, moveX = false, moveY = false) => {
      const newW = Math.max(10, w + dx * (moveX ? -1 : 1));
      const newH = Math.max(10, h + dy * (moveY ? -1 : 1));
      if (moveX) img.x = mx;
      if (moveY) img.y = my;
      img.width = newW / img.scale;
      img.height = newH / img.scale;
    };

    switch (handle) {
      case 'tl': resize(mx - ax, my - ay, true, true); break;
      case 'tr': resize(mx - (ax + w), my - ay, false, true); break;
      case 'bl': resize(mx - ax, my - (ay + h), true, false); break;
      case 'br': resize(mx - (ax + w), my - (ay + h), false, false); break;
      case 'tm': resize(0, my - ay, false, true); break;
      case 'bm': resize(0, my - (ay + h), false, false); break;
      case 'ml': resize(mx - ax, 0, true, false); break;
      case 'mr': resize(mx - (ax + w), 0, false, false); break;
    }

    drawAll();
  }
});

canvas.addEventListener('mouseup', () => {
  if (activeImage) {
    activeImage.dragging = false;
    activeImage.resizing = false;
    activeImage.activeHandle = null;
  }
});

zoomSlider.addEventListener('input', () => {
  const zoom = parseFloat(zoomSlider.value);
  if (activeImage) {
    activeImage.scale = zoom;
    drawAll();
  }
});

deleteBtn.addEventListener('click', () => {
  if (activeImage) {
    placedImages = placedImages.filter(img => img !== activeImage);
    activeImage = null;
    drawAll();
  }
});

exportBtn.addEventListener('click', () => {
  const exportCanvas = document.createElement('canvas');
  const exportCtx = exportCanvas.getContext('2d');
  exportCanvas.width = 400;
  exportCanvas.height = 400;

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const sx = cx - 200;
  const sy = cy - 200;

  const imageData = ctx.getImageData(sx, sy, 400, 400);
  exportCtx.putImageData(imageData, 0, 0);

  exportCtx.globalCompositeOperation = 'destination-in';
  exportCtx.beginPath();
  exportCtx.arc(200, 200, 200, 0, Math.PI * 2);
  exportCtx.fill();

  const link = document.createElement('a');
  link.download = 'ngks_pfp.png';
  link.href = exportCanvas.toDataURL('image/png');
  link.click();
});
