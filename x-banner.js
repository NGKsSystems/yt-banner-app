// ==============================================
// Project: X Banner Editor (Full Logic + Toggle)
// ==============================================

// === Global Variables ===
let canvas, ctx;                         // Canvas & drawing context
let overlays = [];                      // Loaded image overlays
let thumbnails = [];                    // Thumbnail image references
let selectedObjectIndex = -1;           // Currently selected overlay
let dragOffset = { x: 0, y: 0 };        // Drag position offset
let isDragging = false;                 // Dragging state
let isResizing = false;                 // Resizing state
let dragHandleIndex = -1;               // Which handle is being used
let isBannerMode = true;                // Current canvas mode (true = Banner, false = PFP)


// === DOM Ready: Initialize Canvas + Load Mode ===
document.addEventListener("DOMContentLoaded", () => {
  canvas = document.getElementById("canvas");
  if (!canvas) return console.error("Canvas not found.");
  ctx = canvas.getContext("2d");

  // Check ?mode=pfp for launch override
  const urlParams = new URLSearchParams(window.location.search);
  const startInPFPMode = urlParams.get("mode") === 'pfp';
  isBannerMode = !startInPFPMode;

  // Apply starting size
  canvas.width = isBannerMode ? 1500 : 400;
  canvas.height = isBannerMode ? 500 : 400;

  // Init button labels + listeners
  setupCanvasToggle();
  setupUploadHandler();
  setupInteractionHandlers();
  setupToolbarButtons();

  drawCanvas();
});


// === Canvas Toggle Button Logic ===
function setupCanvasToggle() {
  const toggleBtn = document.getElementById('toggleCanvasBtn');
  if (!toggleBtn) return;

  toggleBtn.textContent = isBannerMode ? '👤 Switch to PFP Mode' : '📢 Switch to Banner Mode';

  toggleBtn.addEventListener('click', () => {
    isBannerMode = !isBannerMode;
    canvas.width = isBannerMode ? 1500 : 400;
    canvas.height = isBannerMode ? 500 : 400;
    toggleBtn.textContent = isBannerMode ? '👤 Switch to PFP Mode' : '📢 Switch to Banner Mode';

    // Clear overlays on mode switch
    overlays = [];
    thumbnails = [];
    selectedObjectIndex = -1;
    drawCanvas();
    updateThumbnailBar();
  });
}

// === Upload Image(s) ===
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
          const obj = {
            img,
            x: 100 + i * 10,
            y: 100 + i * 10,
            width: 200,
            height: 150
          };
          overlays.push(obj);
          addThumbnail(obj);
          drawCanvas();
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
    selectedObjectIndex = overlays.indexOf(obj);
    drawCanvas();
  };
  bar.appendChild(thumb);
  thumbnails.push(thumb);
}

function updateThumbnailBar() {
  // Clear & re-append all thumbnails
  const bar = document.getElementById("thumbnail-bar");
  bar.innerHTML = "";
  thumbnails.forEach((thumb) => bar.appendChild(thumb));
}

// === Canvas Draw Loop ===
function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  overlays.forEach((obj, i) => {
    ctx.drawImage(obj.img, obj.x, obj.y, obj.width, obj.height);
    if (i === selectedObjectIndex) drawResizeHandles(obj);
  });
}

// === Draw 8 Resize Handles ===
function drawResizeHandles(obj) {
  const size = 6;
  const positions = [
    { x: obj.x, y: obj.y },
    { x: obj.x + obj.width / 2, y: obj.y },
    { x: obj.x + obj.width, y: obj.y },
    { x: obj.x, y: obj.y + obj.height / 2 },
    { x: obj.x + obj.width, y: obj.y + obj.height / 2 },
    { x: obj.x, y: obj.y + obj.height },
    { x: obj.x + obj.width / 2, y: obj.y + obj.height },
    { x: obj.x + obj.width, y: obj.y + obj.height },
  ];
  ctx.fillStyle = "white";
  positions.forEach(pos => {
    ctx.fillRect(pos.x - size / 2, pos.y - size / 2, size, size);
  });
}

// === Mouse Interactions: Move + Resize ===
function setupInteractionHandlers() {
  canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    selectedObjectIndex = -1;
    for (let i = overlays.length - 1; i >= 0; i--) {
      const obj = overlays[i];
      if (
        mouseX >= obj.x && mouseX <= obj.x + obj.width &&
        mouseY >= obj.y && mouseY <= obj.y + obj.height
      ) {
        selectedObjectIndex = i;
        dragOffset = { x: mouseX - obj.x, y: mouseY - obj.y };
        isDragging = true;
        break;
      }
    }
    drawCanvas();
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!isDragging || selectedObjectIndex === -1) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const obj = overlays[selectedObjectIndex];
    obj.x = mouseX - dragOffset.x;
    obj.y = mouseY - dragOffset.y;
    drawCanvas();
  });

  canvas.addEventListener("mouseup", () => {
    isDragging = false;
    isResizing = false;
  });
}


// === Toolbar Buttons ===
function setupToolbarButtons() {
  const exportBtn = document.getElementById("exportBtn");
  const deleteBtn = document.getElementById("deleteBtn");
  const startoverBtn = document.getElementById("startoverBtn");
  const forwardBtn = document.getElementById("bringForwardBtn");
  const backBtn = document.getElementById("sendBackwardBtn");

  if (exportBtn) exportBtn.onclick = exportBanner;
  
 
  // === Delete Functions ===
  if (deleteBtn) deleteBtn.onclick = () => {
  if (selectedObjectIndex !== -1) {
    overlays.splice(selectedObjectIndex, 1);  // Remove image from canvas
    selectedObjectIndex = -1;                 // Deselect
    drawCanvas();                             // Redraw without deleted item
  }
};

  // === Start Over Function ===
  if (startoverBtn) startoverBtn.onclick = () => {
    overlays = [];
    thumbnails = [];
    selectedObjectIndex = -1;
    document.getElementById("thumbnail-bar").innerHTML = "";
    drawCanvas();
  };

  // === Forward/Back Function ===
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

// === Export Banner as PNG ===
function exportBanner() {
  const wasSelected = selectedObjectIndex;
  selectedObjectIndex = -1;
  drawCanvas(); // Draw without handles

  const dataUrl = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = isBannerMode ? "x-banner.png" : "x-pfp.png";
  a.click();

  selectedObjectIndex = wasSelected;
  drawCanvas(); // Redraw handles after export
}
