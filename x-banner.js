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
          img: img,  // ✅ match the key expected by drawCanvas()
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


// ========================
// Mouse Interaction Logic - Refactored & Annotated
// ========================

// === Globals (already declared outside this block) ===
// canvas, ctx       – DOM canvas and its context
// overlays          – list of overlay image objects
// selectedObjectIndex – index of the selected overlay
// isDragging, isResizing, isRotating – current interaction mode flags
// dragOffsetX/Y     – offsets for dragging

// === Utility: Get Mouse Position ===
function getMousePos(canvas, evt) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,   // X relative to canvas
    y: evt.clientY - rect.top     // Y relative to canvas
  };
}

// === Utility: Check if Point is in Image Bounds ===
function isInsideImage(obj, x, y) {
  const centerX = obj.x + obj.width / 2;
  const centerY = obj.y + obj.height / 2;

  const dx = x - centerX;
  const dy = y - centerY;

  const distance = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) - obj.rotation;  // adjust for rotation

  const unrotatedX = distance * Math.cos(angle) + obj.width / 2;
  const unrotatedY = distance * Math.sin(angle) + obj.height / 2;

  return (
    unrotatedX >= 0 && unrotatedX <= obj.width &&
    unrotatedY >= 0 && unrotatedY <= obj.height
  );
}

// === Utility: Check if Point is on Resize Handle (bottom-right corner) ===
function isOnResizeHandle(obj, x, y) {
  const handleSize = 10;
  const handleX = obj.x + obj.width;
  const handleY = obj.y + obj.height;

  return (
    x >= handleX - handleSize && x <= handleX + handleSize &&
    y >= handleY - handleSize && y <= handleY + handleSize
  );
}

// === Utility: Check if Point is on Rotation Handle (above center) ===
function isOnRotateHandle(obj, x, y) {
  const handleSize = 10;
  const handleX = obj.x + obj.width / 2;
  const handleY = obj.y - 30;

  return (
    x >= handleX - handleSize && x <= handleX + handleSize &&
    y >= handleY - handleSize && y <= handleY + handleSize
  );
}

// === Interaction Events ===
canvas.addEventListener("mousedown", function (e) {
  const mousePos = getMousePos(canvas, e);

  selectedObjectIndex = -1;       // reset selected object
  isDragging = isResizing = isRotating = false;

  for (let i = overlays.length - 1; i >= 0; i--) {
    const obj = overlays[i];

    if (isOnResizeHandle(obj, mousePos.x, mousePos.y)) {
      selectedObjectIndex = i;
      isResizing = true;
      return;
    }
    if (isOnRotateHandle(obj, mousePos.x, mousePos.y)) {
      selectedObjectIndex = i;
      isRotating = true;
      return;
    }
    if (isInsideImage(obj, mousePos.x, mousePos.y)) {
      selectedObjectIndex = i;
      isDragging = true;
      dragOffsetX = mousePos.x - obj.x; // store offset for drag
      dragOffsetY = mousePos.y - obj.y;
      return;
    }
  }
});

canvas.addEventListener("mousemove", function (e) {
  if (selectedObjectIndex === -1) return;

  const obj = overlays[selectedObjectIndex];
  const mousePos = getMousePos(canvas, e);

  if (isDragging) {
    obj.x = mousePos.x - dragOffsetX;     // apply drag offset
    obj.y = mousePos.y - dragOffsetY;
  }

  if (isResizing) {
    obj.width = Math.max(10, mousePos.x - obj.x);   // update width
    obj.height = Math.max(10, mousePos.y - obj.y);  // update height
  }

  if (isRotating) {
    const centerX = obj.x + obj.width / 2;
    const centerY = obj.y + obj.height / 2;
    obj.rotation = Math.atan2(mousePos.y - centerY, mousePos.x - centerX);  // calculate new angle
  }

  drawCanvas();
});

canvas.addEventListener("mouseup", function () {
  isDragging = isResizing = isRotating = false;  // reset modes
});

canvas.addEventListener("mouseleave", function () {
  isDragging = isResizing = isRotating = false;  // cancel actions when mouse leaves canvas
});


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
