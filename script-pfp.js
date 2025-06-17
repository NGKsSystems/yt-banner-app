const canvas = document.getElementById('editor-canvas');
const ctx = canvas.getContext('2d');

const imageLoader = document.getElementById('imageLoader');
const thumbnailBar = document.getElementById('thumbnail-bar');
const zoomSlider = document.getElementById('zoom');
const exportBtn = document.getElementById('export');
const deleteBtn = document.getElementById('delete');

let placedImages = [];
let activeImage = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let isResizing = false;
let resizeDirection = null;

function resizeCanvasToFit() {
  const topBar = document.getElementById('top-bar')?.offsetHeight || 100;
  const thumbBar = document.getElementById('thumbnail-bar')?.offsetHeight || 100;
  canvas.width = Math.floor(window.innerWidth * 0.95);
  canvas.height = Math.floor(window.innerHeight - topBar - thumbBar - 40);
  drawAll();
}
window.addEventListener('resize', resizeCanvasToFit);
resizeCanvasToFit();

imageLoader.addEventListener('change', function (e) {
  const files = e.target.files;
  for (let i = 0; i < files.length; i++) {
    const reader = new FileReader();
    reader.onload = function (event) {
      const img = new Image();
      img.onload = function () {
        const thumb = document.createElement('img');
        thumb.src = img.src;
        thumb.className = 'thumbnail';
        thumb.style.width = '80px';
        thumb.style.cursor = 'pointer';
        thumb.onclick = function () {
          placedImages.push({
            img: img,
            x: 100,
            y: 100,
            width: img.width * 0.4,
            height: img.height * 0.4,
            scale: 1,
          });
          drawAll();
        };
        thumbnailBar.appendChild(thumb);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(files[i]);
  }
});

function drawAll() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  placedImages.forEach(obj => {
    ctx.drawImage(obj.img, obj.x, obj.y, obj.width, obj.height);
    if (obj === activeImage) drawHandles(obj);
  });

  // Draw circular overlay
  const r = 200, cx = canvas.width / 2, cy = canvas.height / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'cyan';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

function drawHandles(obj) {
  const size = 8;
  const points = [
    [obj.x, obj.y], // TL
    [obj.x + obj.width / 2, obj.y], // TC
    [obj.x + obj.width, obj.y], // TR
    [obj.x + obj.width, obj.y + obj.height / 2], // RC
    [obj.x + obj.width, obj.y + obj.height], // BR
    [obj.x + obj.width / 2, obj.y + obj.height], // BC
    [obj.x, obj.y + obj.height], // BL
    [obj.x, obj.y + obj.height / 2], // LC
  ];
  ctx.fillStyle = 'white';
  points.forEach(([x, y]) => ctx.fillRect(x - size / 2, y - size / 2, size, size));
}

function getHandleDirection(x, y, obj) {
  const size = 8;
  const directions = ['tl', 'tc', 'tr', 'rc', 'br', 'bc', 'bl', 'lc'];
  const points = [
    [obj.x, obj.y],
    [obj.x + obj.width / 2, obj.y],
    [obj.x + obj.width, obj.y],
    [obj.x + obj.width, obj.y + obj.height / 2],
    [obj.x + obj.width, obj.y + obj.height],
    [obj.x + obj.width / 2, obj.y + obj.height],
    [obj.x, obj.y + obj.height],
    [obj.x, obj.y + obj.height / 2],
  ];

  for (let i = 0; i < points.length; i++) {
    const [px, py] = points[i];
    if (x >= px - size && x <= px + size && y >= py - size && y <= py + size) {
      return directions[i];
    }
  }
  return null;
}

canvas.addEventListener('mousedown', function (e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  activeImage = null;
  for (let i = placedImages.length - 1; i >= 0; i--) {
    const img = placedImages[i];
    const dir = getHandleDirection(x, y, img);
    if (dir) {
      activeImage = img;
      isResizing = true;
      resizeDirection = dir;
      return;
    } else if (x >= img.x && x <= img.x + img.width && y >= img.y && y <= img.y + img.height) {
      activeImage = img;
      isDragging = true;
      dragOffset.x = x - img.x;
      dragOffset.y = y - img.y;
      return;
    }
  }
});

canvas.addEventListener('mousemove', function (e) {
  if (!activeImage) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (isDragging) {
    activeImage.x = x - dragOffset.x;
    activeImage.y = y - dragOffset.y;
    drawAll();
  } else if (isResizing) {
    switch (resizeDirection) {
      case 'br':
        activeImage.width = x - activeImage.x;
        activeImage.height = y - activeImage.y;
        break;
      case 'tr':
        activeImage.height += activeImage.y - y;
        activeImage.y = y;
        activeImage.width = x - activeImage.x;
        break;
      case 'tl':
        activeImage.width += activeImage.x - x;
        activeImage.height += activeImage.y - y;
        activeImage.x = x;
        activeImage.y = y;
        break;
      case 'bl':
        activeImage.width += activeImage.x - x;
        activeImage.x = x;
        activeImage.height = y - activeImage.y;
        break;
      // You can expand for side-only handles too
    }
    drawAll();
  }
});

canvas.addEventListener('mouseup', () => {
  isDragging = false;
  isResizing = false;
});

zoomSlider.addEventListener('input', function () {
  if (activeImage) {
    const factor = parseFloat(this.value);
    activeImage.width = activeImage.img.width * factor * 0.4;
    activeImage.height = activeImage.img.height * factor * 0.4;
    drawAll();
  }
});

deleteBtn.addEventListener('click', function () {
  if (activeImage) {
    placedImages = placedImages.filter(img => img !== activeImage);
    activeImage = null;
    drawAll();
  }
});

exportBtn.addEventListener('click', function () {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = 400;
  tempCanvas.height = 400;
  const tempCtx = tempCanvas.getContext('2d');

  const centerX = canvas.width / 2 - 200;
  const centerY = canvas.height / 2 - 200;

  tempCtx.beginPath();
  tempCtx.arc(200, 200, 200, 0, Math.PI * 2);
  tempCtx.clip();

  tempCtx.drawImage(canvas, centerX, centerY, 400, 400, 0, 0, 400, 400);

  const link = document.createElement('a');
  link.download = 'profile-pic.png';
  link.href = tempCanvas.toDataURL();
  link.click();
});
