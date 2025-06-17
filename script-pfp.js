/* NGKsExactFit - Fully Integrated PFP Editor Script
   Features: 8-point image/text drag + resize, zoom, snap-to-center, template save/load, export */

const canvas = document.getElementById('editor-canvas');
const ctx = canvas.getContext('2d');
const imageLoader = document.getElementById('imageLoader');
const imageLoader = document.getElementById('imageLoader');
imageLoader.addEventListener('change', () => {
  const fileCount = imageLoader.files.length;
  const label = document.getElementById('file-status');
  label.textContent = fileCount === 0 
    ? 'No files selected' 
    : `${fileCount} file(s) selected`;
});

const thumbnailBar = document.getElementById('thumbnail-bar');
const zoomSlider = document.getElementById('zoom');
const exportBtn = document.getElementById('export');
const deleteBtn = document.getElementById('delete');
const bringForwardBtn = document.getElementById('bringForward');
const sendBackwardBtn = document.getElementById('sendBackward');
const snapCenterBtn = document.getElementById('snapCenter');
const addTextBtn = document.getElementById('addText');
const saveTemplateBtn = document.getElementById('saveTemplate');
const loadTemplateInput = document.getElementById('loadTemplate');
const triggerLoadBtn = document.getElementById('triggerLoadTemplate');

let placedObjects = [];
let activeObject = null;

// Load image thumbnails
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

// Drop image to canvas
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
    const newObj = {
      type: 'image',
      img,
      x, y,
      width: img.width,
      height: img.height,
      zoom: 1
    };
    placedObjects.push(newObj);
    activeObject = newObj;
    drawAll();
  };
});

// Add text object
addTextBtn.addEventListener('click', () => {
  const textObj = {
    type: 'text',
    text: 'Edit me',
    x: 100, y: 100,
    font: '24px Arial',
    color: '#ffffff',
    width: 150,
    height: 40,
    zoom: 1
  };
  placedObjects.push(textObj);
  activeObject = textObj;
  drawAll();
});

// Save/load template
saveTemplateBtn.addEventListener('click', () => {
  const json = JSON.stringify(placedObjects);
  const blob = new Blob([JSON.stringify(placedObjects, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'pfp-template.json';
  a.click();
});

triggerLoadBtn.addEventListener('click', () => loadTemplateInput.click());
loadTemplateInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = () => {

   try {
  const data = JSON.parse(reader.result);
  // continue as normal
} catch (err) {
  alert("⚠️ Failed to parse template. Make sure it's a valid .json file.");
  console.error("JSON parse error:", err);
}
     
    const data = JSON.parse(reader.result);
    placedObjects = [];
    let loadCount = 0;
    data.forEach(obj => {
      if (obj.type === 'image') {
        const img = new Image();
        img.src = obj.img.src;
        img.onload = () => {
          obj.img = img;
          placedObjects.push(obj);
          if (++loadCount === data.length) drawAll();
        };
      } else {
        placedObjects.push(obj);
        if (++loadCount === data.length) drawAll();
      }
    });
  };
  reader.readAsText(file);
});

// Snap-to-center
snapCenterBtn.addEventListener('click', () => {
  if (!activeObject) return;
  activeObject.x = (canvas.width - activeObject.width * activeObject.zoom) / 2;
  activeObject.y = (canvas.height - activeObject.height * activeObject.zoom) / 2;
  drawAll();
});

// Layer control
bringForwardBtn.addEventListener('click', () => {
  const i = placedObjects.indexOf(activeObject);
  if (i < placedObjects.length - 1) {
    [placedObjects[i], placedObjects[i + 1]] = [placedObjects[i + 1], placedObjects[i]];
    drawAll();
  }
});
sendBackwardBtn.addEventListener('click', () => {
  const i = placedObjects.indexOf(activeObject);
  if (i > 0) {
    [placedObjects[i], placedObjects[i - 1]] = [placedObjects[i - 1], placedObjects[i]];
    drawAll();
  }
});

// Delete object
deleteBtn.addEventListener('click', () => {
  if (activeObject) {
    placedObjects = placedObjects.filter(o => o !== activeObject);
    activeObject = null;
    drawAll();
  }
});
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  deleteBtn.click();
});

// Zoom control
zoomSlider.addEventListener('input', () => {
  if (activeObject) {
    activeObject.zoom = parseFloat(zoomSlider.value);
    drawAll();
  }
});

function drawAll() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  placedObjects.forEach(obj => {
    const w = obj.width * obj.zoom;
    const h = obj.height * obj.zoom;
    if (obj.type === 'image') {
      ctx.drawImage(obj.img, obj.x, obj.y, w, h);
    } else if (obj.type === 'text') {
      ctx.font = obj.font;
      ctx.fillStyle = obj.color;
      ctx.fillText(obj.text, obj.x, obj.y + 30);
    }
    if (obj === activeObject) {
      ctx.strokeStyle = '#0f0';
      ctx.strokeRect(obj.x, obj.y, w, h);
    }
  });
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, canvas.height / 2, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Export
exportBtn.addEventListener('click', () => {
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = 512;
  exportCanvas.height = 512;
  const exportCtx = exportCanvas.getContext('2d');
  const offsetX = (canvas.width / 2) - 256;
  const offsetY = (canvas.height / 2) - 256;

  placedObjects.forEach(obj => {
    const w = obj.width * obj.zoom;
    const h = obj.height * obj.zoom;
    const x = obj.x - offsetX;
    const y = obj.y - offsetY;
    if (obj.type === 'image') {
      exportCtx.drawImage(obj.img, x, y, w, h);
    } else if (obj.type === 'text') {
      exportCtx.font = obj.font;
      exportCtx.fillStyle = obj.color;
      exportCtx.fillText(obj.text, x, y + 30);
    }
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

// Dragging + resizing (simplified logic for brevity) — expandable if needed


let dragging = false;
let resizingCorner = null;
let dragOffset = { x: 0, y: 0 };

canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  resizingCorner = null;

  for (let i = placedObjects.length - 1; i >= 0; i--) {
    const obj = placedObjects[i];
    const w = obj.width * obj.zoom;
    const h = obj.height * obj.zoom;
    const cx = obj.x + w / 2;
    const cy = obj.y + h / 2;

    const corners = {
      tl: [obj.x, obj.y], tr: [obj.x + w, obj.y],
      bl: [obj.x, obj.y + h], br: [obj.x + w, obj.y + h],
      tc: [cx, obj.y], bc: [cx, obj.y + h],
      lc: [obj.x, cy], rc: [obj.x + w, cy]
    };

    for (const [corner, [hx, hy]] of Object.entries(corners)) {
      if (Math.abs(x - hx) < 10 && Math.abs(y - hy) < 10) {
        activeObject = obj;
        resizingCorner = corner;
        canvas.style.cursor = 'nwse-resize';
        return;
      }
    }

    if (x > obj.x && x < obj.x + w && y > obj.y && y < obj.y + h) {
      activeObject = obj;
      dragging = true;
      dragOffset = { x: x - obj.x, y: y - obj.y };
      canvas.style.cursor = 'grabbing';
      return;
    }
  }

  activeObject = null;
  drawAll();
});

canvas.addEventListener('mousemove', (e) => {
  if (!activeObject) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const zoom = activeObject.zoom;

  if (resizingCorner) {
    switch (resizingCorner) {
      case 'tl':
        activeObject.width += (activeObject.x - x) / zoom;
        activeObject.height += (activeObject.y - y) / zoom;
        activeObject.x = x;
        activeObject.y = y;
        break;
      case 'tr':
        activeObject.width = (x - activeObject.x) / zoom;
        activeObject.height += (activeObject.y - y) / zoom;
        activeObject.y = y;
        break;
      case 'bl':
        activeObject.width += (activeObject.x - x) / zoom;
        activeObject.x = x;
        activeObject.height = (y - activeObject.y) / zoom;
        break;
      case 'br':
        activeObject.width = (x - activeObject.x) / zoom;
        activeObject.height = (y - activeObject.y) / zoom;
        break;
      case 'tc':
        activeObject.height += (activeObject.y - y) / zoom;
        activeObject.y = y;
        break;
      case 'bc':
        activeObject.height = (y - activeObject.y) / zoom;
        break;
      case 'lc':
        activeObject.width += (activeObject.x - x) / zoom;
        activeObject.x = x;
        break;
      case 'rc':
        activeObject.width = (x - activeObject.x) / zoom;
        break;
    }
    drawAll();
  } else if (dragging) {
    activeObject.x = x - dragOffset.x;
    activeObject.y = y - dragOffset.y;
    drawAll();
  }
});

canvas.addEventListener('mouseup', () => {
  dragging = false;
  resizingCorner = null;
  canvas.style.cursor = 'grab';
});
