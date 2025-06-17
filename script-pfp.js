const canvas = document.getElementById('editor-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvasToWindow() {
  canvas.width = Math.floor(window.innerWidth * 0.95);
  canvas.height = Math.floor(window.innerHeight * 0.75);
  drawAll();
}
window.addEventListener('resize', resizeCanvasToWindow);
resizeCanvasToWindow();

const imageLoader = document.getElementById('imageLoader');
const thumbnailBar = document.getElementById('thumbnail-bar');
const zoomSlider = document.getElementById('zoom');
const exportBtn = document.getElementById('export');
const deleteBtn = document.getElementById('delete');
// const bringForwardBtn = document.getElementById('bringForward');
// const sendBackwardBtn = document.getElementById('sendBackward');

let placedImages = [];
let activeImage = null;

imageLoader.addEventListener('change', (e) => {
  const files = e.target.files;
  [...files].forEach(file => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const newImage = {
        img: img,
        x: 50,
        y: 50,
        width: img.width * 0.25,
        height: img.height * 0.25,
        zoom: 1
      };
      placedImages.push(newImage);
      drawAll();

      // Add thumbnail
      const thumb = document.createElement('img');
      thumb.src = img.src;
      thumb.className = 'thumbnail';
      thumb.addEventListener('click', () => {
        activeImage = newImage;
        drawAll();
      });
      thumbnailBar.appendChild(thumb);
    };
  });
});

zoomSlider.addEventListener('input', () => {
  if (activeImage) {
    activeImage.zoom = parseFloat(zoomSlider.value);
    drawAll();
  }
});

exportBtn.addEventListener('click', () => {
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = 512;
  exportCanvas.height = 512;
  const exportCtx = exportCanvas.getContext('2d');

  placedImages.forEach(img => {
    exportCtx.drawImage(
      img.img,
      img.x,
      img.y,
      img.width * img.zoom,
      img.height * img.zoom
    );
  });

  const circleMask = new Path2D();
  circleMask.arc(256, 256, 256, 0, Math.PI * 2);
  exportCtx.globalCompositeOperation = 'destination-in';
  exportCtx.fill(circleMask);

  const link = document.createElement('a');
  link.download = 'pfp.png';
  link.href = exportCanvas.toDataURL();
  link.click();
});

deleteBtn.addEventListener('click', () => {
  if (activeImage) {
    placedImages = placedImages.filter(img => img !== activeImage);
    activeImage = null;
    drawAll();
  }
});

// bringForwardBtn.addEventListener('click', () => {
//   if (!activeImage) return;
//   const index = placedImages.indexOf(activeImage);
//   if (index < placedImages.length - 1) {
//     [placedImages[index], placedImages[index + 1]] = [placedImages[index + 1], placedImages[index]];
//     drawAll();
//   }
// });

// sendBackwardBtn.addEventListener('click', () => {
//   if (!activeImage) return;
//   const index = placedImages.indexOf(activeImage);
//   if (index > 0) {
//     [placedImages[index], placedImages[index - 1]] = [placedImages[index - 1], placedImages[index]];
//     drawAll();
//   }
// });

function drawAll() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  placedImages.forEach(img => {
    ctx.drawImage(
      img.img,
      img.x,
      img.y,
      img.width * img.zoom,
      img.height * img.zoom
    );

    // Show resize box
    if (img === activeImage) {
      ctx.strokeStyle = '#0f0';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        img.x,
        img.y,
        img.width * img.zoom,
        img.height * img.zoom
      );

      // Resize handle
      ctx.fillStyle = '#0f0';
      ctx.fillRect(
        img.x + img.width * img.zoom - 8,
        img.y + img.height * img.zoom - 8,
        8,
        8
      );
    }
  });

  // Circular overlay
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, canvas.height / 2, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// 🖱 Drag + Resize Handling
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let resizing = false;

canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  for (let i = placedImages.length - 1; i >= 0; i--) {
    const img = placedImages[i];
    const iw = img.width * img.zoom;
    const ih = img.height * img.zoom;

    if (x >= img.x + iw - 10 && x <= img.x + iw &&
        y >= img.y + ih - 10 && y <= img.y + ih) {
      activeImage = img;
      resizing = true;
      canvas.style.cursor = 'nwse-resize';
      return;
    }

    if (x >= img.x && x <= img.x + iw &&
        y >= img.y && y <= img.y + ih) {
      activeImage = img;
      isDragging = true;
      dragOffsetX = x - img.x;
      dragOffsetY = y - img.y;
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

  if (resizing) {
    activeImage.width = (x - activeImage.x) / activeImage.zoom;
    activeImage.height = (y - activeImage.y) / activeImage.zoom;
    drawAll();
  } else if (isDragging) {
    activeImage.x = x - dragOffsetX;
    activeImage.y = y - dragOffsetY;
    drawAll();
  }
});

canvas.addEventListener('mouseup', () => {
  isDragging = false;
  resizing = false;
  canvas.style.cursor = 'grab';
});
