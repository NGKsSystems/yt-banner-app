const canvas = document.getElementById('editor-canvas');
const ctx = canvas.getContext('2d');

const imageLoader = document.getElementById('imageLoader');
const thumbnailBar = document.getElementById('thumbnail-bar');
const zoomSlider = document.getElementById('zoom');
const exportBtn = document.getElementById('export');
const deleteBtn = document.getElementById('delete');
const bringForwardBtn = document.getElementById('bringForward');
const sendBackwardBtn = document.getElementById('sendBackward');

let placedImages = [];
let activeImage = null;

// --- Load and create thumbnails ---
imageLoader.addEventListener('change', (e) => {
  const files = e.target.files;
  [...files].forEach(file => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const thumb = document.createElement('img');
      thumb.src = img.src;
      thumb.className = 'thumbnail';
      thumb.draggable = true;

      thumb.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('imgsrc', img.src);
      });

      thumbnailBar.style.display = 'flex';
      thumbnailBar.appendChild(thumb);
    };
  });
});

// --- Drag image onto canvas ---
canvas.addEventListener('dragover', (e) => e.preventDefault());

canvas.addEventListener('drop', (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const src = e.dataTransfer.getData('imgsrc');
  if (!src) return;

  const img = new Image();
  img.src = src;
  img.onload = () => {
    const newImage = {
      img,
      x,
      y,
      width: img.width,
      height: img.height,
      zoom: 1
    };
    placedImages.push(newImage);
    activeImage = newImage;
    drawAll();
  };
});

// --- Zoom ---
zoomSlider.addEventListener('input', () => {
  if (activeImage) {
    activeImage.zoom = parseFloat(zoomSlider.value);
    drawAll();
  }
});

// --- Export ---
exportBtn.addEventListener('click', () => {
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = 512;
  exportCanvas.height = 512;
  const exportCtx = exportCanvas.getContext('2d');

  const offsetX = (canvas.width / 2) - 256;
  const offsetY = (canvas.height / 2) - 256;

  placedImages.forEach(img => {
    exportCtx.drawImage(
      img.img,
      img.x - offsetX,
      img.y - offsetY,
      img.width * img.zoom,
      img.height * img.zoom
    );
  });

  const mask = new Path2D();
  mask.arc(256, 256, 256, 0, Math.PI * 2);
  exportCtx.globalCompositeOperation = 'destination-in';
  exportCtx.fill(mask);

  const link = document.createElement('a');
  link.download = 'pfp.png';
  link.href = exportCanvas.toDataURL();
  link.click();
});

// --- Delete ---
deleteBtn.addEventListener('click', () => {
  if (activeImage) {
    placedImages = placedImages.filter(i => i !== activeImage);
    activeImage = null;
    drawAll();
  }
});

// --- Layer Controls ---
bringForwardBtn.addEventListener('click', () => {
  if (!activeImage) return;
  const i = placedImages.indexOf(activeImage);
  if (i < placedImages.length - 1) {
    [placedImages[i], placedImages[i + 1]] = [placedImages[i + 1], placedImages[i]];
    drawAll();
  }
});

sendBackwardBtn.addEventListener('click', () => {
  if (!activeImage) return;
  const i = placedImages.indexOf(activeImage);
  if (i > 0) {
    [placedImages[i], placedImages[i - 1]] = [placedImages[i - 1], placedImages[i]];
    drawAll();
  }
});

// --- Draw everything ---
function drawAll() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  placedImages.forEach(img => {
    const w = img.width * img.zoom;
    const h = img.height * img.zoom;
    ctx.drawImage(img.img, img.x, img.y, w, h);

    if (img === activeImage) {
      ctx.strokeStyle = '#0f0';
      ctx.lineWidth = 2;
      ctx.strokeRect(img.x, img.y, w, h);

      const cx = img.x + w / 2;
      const cy = img.y + h / 2;
      const handles = [
        [img.x, img.y],        // TL
        [cx, img.y],           // TC
        [img.x + w, img.y],    // TR
        [img.x + w, cy],       // RC
        [img.x + w, img.y + h],// BR
        [cx, img.y + h],       // BC
        [img.x, img.y + h],    // BL
        [img.x, cy]            // LC
      ];
      ctx.fillStyle = '#0f0';
      handles.forEach(([hx, hy]) => ctx.fillRect(hx - 4, hy - 4, 8, 8));
    }
  });

  // --- Circular overlay ---
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, canvas.height / 2, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// --- Drag + Resize ---
let dragging = false;
let resizingCorner = null;
let dragOffset = { x: 0, y: 0 };

canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  resizingCorner = null;

  for (let i = placedImages.length - 1; i >= 0; i--) {
    const img = placedImages[i];
    const w = img.width * img.zoom;
    const h = img.height * img.zoom;

    const cx = img.x + w / 2;
    const cy = img.y + h / 2;
    const corners = {
      tl: [img.x, img.y],
      tc: [cx, img.y],
      tr: [img.x + w, img.y],
      rc: [img.x + w, cy],
      br: [img.x + w, img.y + h],
      bc: [cx, img.y + h],
      bl: [img.x, img.y + h],
      lc: [img.x, cy]
    };

    for (const [corner, [cx, cy]] of Object.entries(corners)) {
      if (Math.abs(x - cx) < 10 && Math.abs(y - cy) < 10) {
        activeImage = img;
        resizingCorner = corner;
        canvas.style.cursor = 'nwse-resize';
        return;
      }
    }

    if (x > img.x && x < img.x + w && y > img.y && y < img.y + h) {
      activeImage = img;
      dragging = true;
      dragOffset.x = x - img.x;
      dragOffset.y = y - img.y;
      canvas.style.cursor = 'grabbing';
      return;
    }
  }

  activeImage = null;
  drawAll();
});

canvas.addEventListener('mousemove', (e) => {
  if (!activeImage) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const zoom = activeImage.zoom;

  if (resizingCorner) {
    switch (resizingCorner) {
      case 'br':
        activeImage.width = (x - activeImage.x) / zoom;
        activeImage.height = (y - activeImage.y) / zoom;
        break;
      case 'bl':
        activeImage.width += (activeImage.x - x) / zoom;
        activeImage.x = x;
        activeImage.height = (y - activeImage.y) / zoom;
        break;
      case 'tr':
        activeImage.width = (x - activeImage.x) / zoom;
        activeImage.height += (activeImage.y - y) / zoom;
        activeImage.y = y;
        break;
      case 'tl':
        activeImage.width += (activeImage.x - x) / zoom;
        activeImage.height += (activeImage.y - y) / zoom;
        activeImage.x = x;
        activeImage.y = y;
        break;
      case 'tc':
        activeImage.height += (activeImage.y - y) / zoom;
        activeImage.y = y;
        break;
      case 'bc':
        activeImage.height = (y - activeImage.y) / zoom;
        break;
      case 'lc':
        activeImage.width += (activeImage.x - x) / zoom;
        activeImage.x = x;
        break;
      case 'rc':
        activeImage.width = (x - activeImage.x) / zoom;
        break;
    }
    drawAll();
  } else if (dragging) {
    activeImage.x = x - dragOffset.x;
    activeImage.y = y - dragOffset.y;
    drawAll();
  }
});

canvas.addEventListener('mouseup', () => {
  dragging = false;
  resizingCorner = null;
  canvas.style.cursor = 'grab';
});

canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (activeImage) {
    placedImages = placedImages.filter(i => i !== activeImage);
    activeImage = null;
    drawAll();
  }
});
