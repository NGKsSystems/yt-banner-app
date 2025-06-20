// ==============================================
// Project: X Banner Editor (Full Logic + Toggle)
// ==============================================

// === Global Variables ===
let canvas, ctx;
let overlays = [];
let thumbnails = [];
let selectedObjectIndex = -1;
let dragOffset = { x: 0, y: 0 };
let isDragging = false;
let isResizing = false;
let isRotating = false;
let dragHandleIndex = -1;
let isBannerMode = true;

// === DOM Ready: Initialize Canvas + Load Mode ===
document.addEventListener("DOMContentLoaded", () => {
  canvas = document.getElementById("canvas");
  if (!canvas) return console.error("Canvas not found.");
  ctx = canvas.getContext("2d");

  // Check ?mode=pfp for launch override
  const urlParams = new URLSearchParams(window.location.search);
  const startInpfpMode = urlParams.get("mode") === 'pfp';
  isBannerMode = !startInpfpMode;

  // Apply starting canvas size
  canvas.width = isBannerMode ? 1500 : 800;
  canvas.height = isBannerMode ? 500 : 800;

  // Init handlers
  setupCanvasToggle();
  setupUploadHandler();
  setupInteractionHandlers();
  setupToolbarButtons();

  // Enable drag-and-drop support
  canvas.addEventListener("dragover", (e) => e.preventDefault());

  canvas.addEventListener("drop", (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    try {
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      const img = new Image();
      img.onload = () => {
        overlays.push({
          img: img,
          x: mouseX - data.width / 2,
          y: mouseY - data.height / 2,
          width: data.width,
          height: data.height,
          rotation: 0
        });
        drawCanvas();
      };
      img.src = data.src;
    } catch (err) {
      console.error("Invalid drop:", err);
    }
  });

  drawCanvas();
});

// === Canvas Toggle Button Logic ===
function setupCanvasToggle() {
  const toggleBtn = document.getElementById('toggleCanvasBtn');
  if (!toggleBtn) return;

  toggleBtn.textContent = isBannerMode ? '👤 Switch to PFP Mode' : '📢 Switch to Banner Mode';

  toggleBtn.addEventListener('click', () => {
    isBannerMode = !isBannerMode;
    canvas.width = isBannerMode ? 1500 : 800;
    canvas.height = isBannerMode ? 500 : 800;
    toggleBtn.textContent = isBannerMode ? '👤 Switch to PFP Mode' : '📢 Switch to Banner Mode';

    overlays = [];
    thumbnails = [];
    selectedObjectIndex = -1;
    drawCanvas();
    updateThumbnailBar();
  });
}

// === Upload Image(s) from File Input ===
function setupUploadHandler() {
  const input = document.getElementById("imageLoader");
  if (!input) return;

  input.addEventListener("change", (e) => {
    const files = e.target.files;
    if (!files.length) return;

    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();
      reader.onload = function (event) {
        const img = new Image();
        img.onload = function () {
  const width = 200;
  const height = 150;
  const obj = {
    img,
    x: 0,
    y: 0,
    width,
    height,
    rotation: 0
  };
  addThumbnail(obj); // Only add to thumbnail bar, not canvas
};

        img.src = event.target.result;
      };
      reader.readAsDataURL(files[i]);
    }
  });
}

// === Add Image to Thumbnail Tray ===
function addThumbnail(obj) {
  const bar = document.getElementById("thumbnail-bar");
  const thumb = document.createElement("img");
  thumb.src = obj.img.src;
  thumb.className = "thumbnail";

  thumb.onclick = () => {
    const centered = {
      ...obj,
      x: (canvas.width - obj.width) / 2,
      y: (canvas.height - obj.height) / 2
    };
    overlays.push(centered);
    selectedObjectIndex = overlays.length - 1;
    drawCanvas();
  };

  thumb.draggable = true;
  thumb.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({
      src: obj.img.src,
      width: obj.width,
      height: obj.height
    }));
  });

  bar.appendChild(thumb);
  thumbnails.push(thumb);
}

function updateThumbnailBar() {
  const bar = document.getElementById("thumbnail-bar");
  bar.innerHTML = "";
  thumbnails.forEach((thumb) => bar.appendChild(thumb));
}

// === Canvas Draw Loop ===
function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the entire canvas

  // Draw each image overlay
  overlays.forEach((obj, i) => {
    ctx.drawImage(obj.img, obj.x, obj.y, obj.width, obj.height); // Draw image

    // Highlight selected overlay
    if (i === selectedObjectIndex) {
      ctx.strokeStyle = "white";                 // Selection border color
      ctx.lineWidth = 1;
      ctx.strokeRect(obj.x, obj.y, obj.width, obj.height); // Draw selection border
      drawResizeHandles(obj);                   // Draw resize handles
    }
  });

  // === Draw circular safe zone for PFP mode (Twitter/X) ===
  if (!isBannerMode) {
    const circleDiameter = 400;                 // Fixed circle size
    const centerX = canvas.width / 2;           // Center of canvas
    const centerY = canvas.height / 2;
    const radius = circleDiameter / 2;          // Radius = 200

    ctx.beginPath();                             // Outer circle stroke
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.beginPath();                             // Inner transparent fill
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
    ctx.fill();
  }
} // ✅ close drawCanvas() properly

// === Draw 8 Resize Handles ===
function drawResizeHandles(obj) {
  const size = 14;

  // === Resize handles: 8 corners and edges
  const positions = [
    { x: obj.x, y: obj.y },
    { x: obj.x + obj.width / 2, y: obj.y },
    { x: obj.x + obj.width, y: obj.y },
    { x: obj.x, y: obj.y + obj.height / 2 },
    { x: obj.x + obj.width, y: obj.y + obj.height / 2 },
    { x: obj.x, y: obj.y + obj.height },
    { x: obj.x + obj.width / 2, y: obj.y + obj.height },
    { x: obj.x + obj.width, y: obj.y + obj.height }
  ];

  ctx.fillStyle = "white";
  positions.forEach(pos => {
    ctx.fillRect(pos.x - size / 2, pos.y - size / 2, size, size);
  });

  // === Rotation handle: 30px above top-center of object
  const cx = obj.x + obj.width / 2;
  const cy = obj.y;

  // Draw connecting line
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx, cy - 30);
  ctx.strokeStyle = "white";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Draw circular handle
  ctx.beginPath();
  ctx.arc(cx, cy - 30, 8, 0, 2 * Math.PI);
  ctx.fillStyle = "gray";
  ctx.fill();
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.stroke();
}


// === Mouse Interactions: Move + Resize ===
function setupInteractionHandlers() {
  canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    selectedObjectIndex = -1;
    isDragging = false;
    isResizing = false;
    isRotating = false;

    for (let i = overlays.length - 1; i >= 0; i--) {
      const obj = overlays[i];
      const cx = obj.x + obj.width / 2;
      const cy = obj.y + obj.height / 2;
      const dx = mouseX - cx;
      const dy = mouseY - cy;
      const cos = Math.cos(-obj.rotation);
      const sin = Math.sin(-obj.rotation);
      const localX = dx * cos - dy * sin;
      const localY = dx * sin + dy * cos;
      const halfW = obj.width / 2;
      const halfH = obj.height / 2;

    // === Detect rotation handle click in canvas space (not local)
      const rotHandleX_canvas = obj.x + obj.width / 2;
      const rotHandleY_canvas = obj.y - 30;
      const dist = Math.hypot(mouseX - rotHandleX_canvas, mouseY - rotHandleY_canvas);
      
      if (dist < 14) {
        selectedObjectIndex = i;
        isRotating = true;
        return;
      }


      if (
        localX >= -halfW && localX <= halfW &&
        localY >= -halfH && localY <= halfH
      ) {
        selectedObjectIndex = i;
       dragOffset = {
         x: mouseX - obj.x,
         y: mouseY - obj.y
         };

        const handles = [
          [-halfW, -halfH], [0, -halfH], [halfW, -halfH],
          [-halfW, 0], [halfW, 0],
          [-halfW, halfH], [0, halfH], [halfW, halfH]
        ];

        const size = 14;
        handles.forEach(([hx, hy], index) => {
          if (
            localX >= hx - size && localX <= hx + size &&
            localY >= hy - size && localY <= hy + size
          ) {
            isResizing = true;
            dragHandleIndex = index;
          }
        });

        if (!isResizing) isDragging = true;
        return;
      }
    }
  });

  canvas.addEventListener("mousemove", (e) => {
    if (selectedObjectIndex === -1) return;

    const obj = overlays[selectedObjectIndex];
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const cx = obj.x + obj.width / 2;
    const cy = obj.y + obj.height / 2;
    const dx = mouseX - cx;
    const dy = mouseY - cy;
    const cos = Math.cos(-obj.rotation);
    const sin = Math.sin(-obj.rotation);
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;

    if (isRotating) {
      obj.rotation = Math.atan2(dy, dx) + Math.PI / 2;
      drawCanvas();
      return;
    }

    if (isDragging) {
      obj.x = mouseX - dragOffset.x;
      obj.y = mouseY - dragOffset.y;
      drawCanvas();
      return;
   }


    if (isResizing) {
      const handleX = [-1, 0, 1, -1, 1, -1, 0, 1][dragHandleIndex];
      const handleY = [-1, -1, -1, 0, 0, 1, 1, 1][dragHandleIndex];

      if (handleX !== 0) {
        let newWidth = (localX * handleX) + (obj.width / 2);
        obj.width = Math.max(20, newWidth);
        obj.x = cx - obj.width / 2;
      }

      if (handleY !== 0) {
        let newHeight = (localY * handleY) + (obj.height / 2);
        obj.height = Math.max(20, newHeight);
        obj.y = cy - obj.height / 2;
      }
    }

    obj.width = Math.max(20, obj.width);
    obj.height = Math.max(20, obj.height);
    drawCanvas();
  });

  // canvas.addEventListener("mouseup", ...)
window.addEventListener("mouseup", () => {
  isDragging = false;
  isResizing = false;
  isRotating = false;
});

canvas.addEventListener("mouseleave", () => {
  isDragging = false;
  isResizing = false;
  isRotating = false;
});
}

// === Toolbar Buttons: Export, Layering, Delete ===
function setupToolbarButtons() {
  const exportBtn = document.getElementById("exportBtn");
  const deleteBtn = document.getElementById("deleteBtn");
  const startoverBtn = document.getElementById("startoverBtn");
  const forwardBtn = document.getElementById("bringForwardBtn");
  const backBtn = document.getElementById("sendBackwardBtn");

  if (exportBtn) exportBtn.onclick = exportBanner;

  if (deleteBtn) deleteBtn.onclick = () => {
    if (selectedObjectIndex !== -1) {
      overlays.splice(selectedObjectIndex, 1);
      selectedObjectIndex = -1;
      drawCanvas();
    }
  };

  if (startoverBtn) startoverBtn.onclick = () => {
    overlays = [];
    thumbnails = [];
    selectedObjectIndex = -1;
    document.getElementById("thumbnail-bar").innerHTML = "";
    drawCanvas();
  };

  if (forwardBtn) forwardBtn.onclick = () => {
    if (selectedObjectIndex > -1 && selectedObjectIndex < overlays.length - 1) {
      const temp = overlays[selectedObjectIndex];
      overlays[selectedObjectIndex] = overlays[selectedObjectIndex + 1];
      overlays[selectedObjectIndex + 1] = temp;
      selectedObjectIndex++;
      drawCanvas();
    }
  };

  if (backBtn) backBtn.onclick = () => {
    if (selectedObjectIndex > 0) {
      const temp = overlays[selectedObjectIndex];
      overlays[selectedObjectIndex] = overlays[selectedObjectIndex - 1];
      overlays[selectedObjectIndex - 1] = temp;
      selectedObjectIndex--;
      drawCanvas();
    }
  };
}

// === Export Canvas as PNG (Hide Handles) ===
function exportBanner() {
  if (!isBannerMode) {
    // === Circular PFP Export ===
    const size = 400;
    const radius = size / 2;

    // Create export canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = size;
    tempCanvas.height = size;
    const tempCtx = tempCanvas.getContext('2d');

    // Clip to circular region
    tempCtx.beginPath();
    tempCtx.arc(radius, radius, radius, 0, 2 * Math.PI);
    tempCtx.closePath();
    tempCtx.clip(); // ⛔ clip everything outside the circle

    // Calculate center of source canvas
    const srcX = (canvas.width - size) / 2;
    const srcY = (canvas.height - size) / 2;

    // Draw canvas content into the clipped circle
    tempCtx.drawImage(canvas, srcX, srcY, size, size, 0, 0, size, size);

    // Export
    const dataUrl = tempCanvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "x-pfp-circle.png";
    a.click();
  } else {
    // === Normal Banner Export ===
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "x-banner.png";
    a.click();
  }
}
 

// === Keyboard arrows to move selected image overlay ===
document.addEventListener('keydown', (e) => {
  if (selectedObjectIndex === -1) return;

  const obj = overlays[selectedObjectIndex];

  // Only prevent browser scroll if an arrow key is pressed
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
    e.preventDefault();
  }

  const step = e.shiftKey ? 10 : 1;

  switch (e.key) {
    case 'ArrowLeft':
      obj.x -= step;
      break;
    case 'ArrowRight':
      obj.x += step;
      break;
    case 'ArrowUp':
      obj.y -= step;
      break;
    case 'ArrowDown':
      obj.y += step;
      break;
  }

  drawCanvas();
});
