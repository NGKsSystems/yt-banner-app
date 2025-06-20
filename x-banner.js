// ==============================================
// Project: X Banner Editor (Full Logic + Toggle)
// ==============================================

// === Global Variables ===
// === let canvas, ctx;
let overlays = [];
let thumbnails = [];
// === let selectedObjectIndex = -1;
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


// === Enhanced Mouse Interaction Logic (Move, Resize, Rotate) ===

canvas = document.getElementById("canvas");                      // Link to <canvas id="canvas">

let dragOffsetX = 0;                                              // Distance from cursor to object center (X)
let dragOffsetY = 0;                                              // Distance from cursor to object center (Y)
let selectedObjectIndex = -1;                                     // Index of the selected image overlay
let isDragging = false;                                           // Whether we are currently dragging an image
let isResizing = false;                                           // Whether we are currently resizing
let isRotating = false;                                           // Whether we are currently rotating
let dragHandleIndex = -1;                                         // Index of the resize handle corner (0-7)

function setupInteractionHandlers() {
  // === Mouse Down: Select Object or Handle ===
  canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();                  // Get canvas position relative to viewport
    const mouseX = e.clientX - rect.left;                         // X position of mouse within canvas
    const mouseY = e.clientY - rect.top;                          // Y position of mouse within canvas

    for (let i = overlays.length - 1; i >= 0; i--) {              // Loop through overlays in reverse (topmost first)
      const obj = overlays[i];
      const centerX = obj.x + obj.width / 2;                      // Get center X of the object
      const centerY = obj.y + obj.height / 2;                     // Get center Y of the object
      const dx = mouseX - centerX;                                // X distance from object center
      const dy = mouseY - centerY;                                // Y distance from object center
      const angle = -obj.rotation;                                // Inverse rotation for coordinate unrotation
      const rotatedX = dx * Math.cos(angle) - dy * Math.sin(angle); // Adjust mouse X for object rotation
      const rotatedY = dx * Math.sin(angle) + dy * Math.cos(angle); // Adjust mouse Y for object rotation

      const halfW = obj.width / 2;                                // Half width of object
      const halfH = obj.height / 2;                               // Half height of object
      const margin = 8;                                           // Margin of forgiveness for handle hitboxes

      // === Resize Handle Detection (8-point corners) ===
      const corners = [                                           // Define corner/side handle positions
        [-halfW, -halfH], [0, -halfH], [halfW, -halfH],
        [-halfW, 0],              [halfW, 0],
        [-halfW, halfH], [0, halfH], [halfW, halfH]
      ];
      for (let j = 0; j < corners.length; j++) {
        const [cx, cy] = corners[j];
        if (Math.abs(rotatedX - cx) < margin && Math.abs(rotatedY - cy) < margin) {
          selectedObjectIndex = i;
          dragHandleIndex = j;                                    // Store which corner we're resizing
          isResizing = true;                                      // Enable resize mode
          return;
        }
      }

      // === Rotation Handle Detection (Top Center, 30px above) ===
      const rotHandleX = obj.x + obj.width / 2;                   // Rotation handle X
      const rotHandleY = obj.y - 30;                              // Rotation handle Y (above object)
      const dist = Math.hypot(mouseX - rotHandleX, mouseY - rotHandleY); // Distance from mouse to handle
      if (dist < 14) {
        selectedObjectIndex = i;
        isRotating = true;                                        // Enable rotation mode
        return;
      }

      // === Move/Drag Detection (within object bounds) ===
      if (rotatedX > -halfW && rotatedX < halfW && rotatedY > -halfH && rotatedY < halfH) {
        selectedObjectIndex = i;
        isDragging = true;                                        // Enable drag mode
        dragOffsetX = rotatedX;                                   // Store grab offset X
        dragOffsetY = rotatedY;                                   // Store grab offset Y
        return;
      }
    }
  });

  // === Mouse Move: Update Interaction ===
  canvas.addEventListener("mousemove", (e) => {
    if (selectedObjectIndex === -1) return;                       // Skip if no object is selected
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const obj = overlays[selectedObjectIndex];

    if (isDragging) {
      const dx = dragOffsetX * Math.cos(obj.rotation) - dragOffsetY * Math.sin(obj.rotation); // Adjust X by rotation
      const dy = dragOffsetX * Math.sin(obj.rotation) + dragOffsetY * Math.cos(obj.rotation); // Adjust Y by rotation
      obj.x = mouseX - dx;                                         // Apply movement offset
      obj.y = mouseY - dy;
    }

    if (isResizing) {
      const handleX = [-1, 0, 1, -1, 1, -1, 0, 1][dragHandleIndex]; // Handle direction X
      const handleY = [-1, -1, -1, 0, 0, 1, 1, 1][dragHandleIndex]; // Handle direction Y
      const centerX = obj.x + obj.width / 2;
      const centerY = obj.y + obj.height / 2;
      const dx = mouseX - centerX;
      const dy = mouseY - centerY;
      const angle = -obj.rotation;
      const rotatedX = dx * Math.cos(angle) - dy * Math.sin(angle); // Unrotated X distance
      const rotatedY = dx * Math.sin(angle) + dy * Math.cos(angle); // Unrotated Y distance
      obj.width = Math.abs(rotatedX) * 2 * Math.abs(handleX || 1);  // Resize width based on direction
      obj.height = Math.abs(rotatedY) * 2 * Math.abs(handleY || 1); // Resize height based on direction
    }

    if (isRotating) {
      const centerX = obj.x + obj.width / 2;
      const centerY = obj.y + obj.height / 2;
      const dx = mouseX - centerX;
      const dy = mouseY - centerY;
      obj.rotation = Math.atan2(dy, dx);                           // Update object rotation
    }
  });

  // === Mouse Up: End All Interaction Modes ===
  canvas.addEventListener("mouseup", () => {
    isDragging = false;                                           // Stop dragging
    isResizing = false;                                           // Stop resizing
    isRotating = false;                                           // Stop rotating
  });

  // === Mouse Leaves Canvas: Also Cancel Interactions ===
  canvas.addEventListener("mouseleave", () => {
    isDragging = false;
    isResizing = false;
    isRotating = false;
  });
}

// === Initialize Interaction on Page Load ===
window.onload = () => {
  setupInteractionHandlers();                                     // Register event handlers once DOM is ready
};


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
