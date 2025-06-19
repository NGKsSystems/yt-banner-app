// === X Banner Editor – Final Build (Corrected) ===
// ✅ Thumbnails-only upload
// ✅ Click-to-add to canvas
// ✅ 8-handle resize
// ✅ Drag & delete
// ✅ Clean export (no handles)

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("canvas");
  if (!canvas) return console.error("Canvas not found.");

  const ctx = canvas.getContext("2d");
  canvas.width = 1500;
  canvas.height = 500;

  let overlays = [];
  let thumbnails = [];
  let selectedObjectIndex = -1;
  let dragOffset = { x: 0, y: 0 };
  let isDragging = false;
  let isResizing = false;
  let dragHandleIndex = -1;

  // === Upload Handler ===
  document.getElementById("imageLoader").addEventListener("change", (event) => {
    const files = event.target.files;
    thumbnails = [];
    const tray = document.getElementById("thumbnail-bar");
    tray.innerHTML = "";

    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
          thumbnails.push(img);

          const thumb = document.createElement("img");
          thumb.src = e.target.result;
          thumb.className = "thumbnail";
          thumb.onclick = () => {
            overlays.push({
              img,
              x: 100 + overlays.length * 20,
              y: 100 + overlays.length * 20,
              width: 200,
              height: 150,
            });
            drawCanvas();
          };
          tray.appendChild(thumb);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(files[i]);
    }
  });

  // === Draw Canvas ===
  function drawCanvas(suppressHandles = false) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  overlays.forEach((obj, i) => {
    ctx.drawImage(obj.img, obj.x, obj.y, obj.width, obj.height);
    if (!suppressHandles && i === selectedObjectIndex) {
      drawResizeHandles(obj);
    }
  });
}

  // === Resize Handles ===
  function drawResizeHandles(obj) {
    const handles = getHandlePositions(obj);
    handles.forEach((h) => {
      ctx.fillStyle = "white";
      ctx.fillRect(h.x - 4, h.y - 4, 8, 8);
    });
  }

  function getHandlePositions(obj) {
    const { x, y, width: w, height: h } = obj;
    return [
      { x: x, y: y },
      { x: x + w / 2, y: y },
      { x: x + w, y: y },
      { x: x, y: y + h / 2 },
      { x: x + w, y: y + h / 2 },
      { x: x, y: y + h },
      { x: x + w / 2, y: y + h },
      { x: x + w, y: y + h },
    ];
  }

  function getHandleIndex(mouseX, mouseY, obj) {
    const handles = getHandlePositions(obj);
    for (let i = 0; i < handles.length; i++) {
      const h = handles[i];
      if (
        mouseX >= h.x - 6 &&
        mouseX <= h.x + 6 &&
        mouseY >= h.y - 6 &&
        mouseY <= h.y + 6
      ) {
        return i;
      }
    }
    return -1;
  }

  // === Canvas Interaction Events ===
  canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    selectedObjectIndex = -1;
    for (let i = overlays.length - 1; i >= 0; i--) {
      const obj = overlays[i];
      const hIndex = getHandleIndex(mouseX, mouseY, obj);
      if (hIndex !== -1) {
        selectedObjectIndex = i;
        dragHandleIndex = hIndex;
        isResizing = true;
        return;
      } else if (
        mouseX >= obj.x &&
        mouseX <= obj.x + obj.width &&
        mouseY >= obj.y &&
        mouseY <= obj.y + obj.height
      ) {
        selectedObjectIndex = i;
        dragOffset.x = mouseX - obj.x;
        dragOffset.y = mouseY - obj.y;
        isDragging = true;
        break;
      }
    }
    drawCanvas();
  });

  canvas.addEventListener("mousemove", (e) => {
    if (selectedObjectIndex === -1) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const obj = overlays[selectedObjectIndex];

    if (isDragging) {
      obj.x = mouseX - dragOffset.x;
      obj.y = mouseY - dragOffset.y;
    } else if (isResizing) {
      const dx = mouseX - obj.x;
      const dy = mouseY - obj.y;
      obj.width = Math.max(20, dx);
      obj.height = Math.max(20, dy);
    }

    drawCanvas();
  });

  canvas.addEventListener("mouseup", () => {
    isDragging = false;
    isResizing = false;
    dragHandleIndex = -1;
  });

  // === Arrow Keys Move ===
  document.addEventListener("keydown", (e) => {
    if (selectedObjectIndex === -1) return;
    const obj = overlays[selectedObjectIndex];
    const step = 5;

    switch (e.key) {
      case "ArrowUp":
        obj.y -= step;
        break;
      case "ArrowDown":
        obj.y += step;
        break;
      case "ArrowLeft":
        obj.x -= step;
        break;
      case "ArrowRight":
        obj.x += step;
        break;
      case "Delete":
        overlays.splice(selectedObjectIndex, 1);
        selectedObjectIndex = -1;
        break;
      default:
        return;
    }

    drawCanvas();
  });

  // === Export Button ===
  document.getElementById("exportBtn").addEventListener("click", () => {
  drawCanvas(true); // ⛔ don't draw handles
  const imgData = canvas.toDataURL("image/png");

  const link = document.createElement("a");
  link.href = imgData;
  link.download = "x-banner.png";
  link.click();

  drawCanvas(); // ✅ redraw with handles after export
});

  // === Delete Button ===
  document.getElementById("deleteBtn").addEventListener("click", () => {
    if (selectedObjectIndex !== -1) {
      overlays.splice(selectedObjectIndex, 1);
      selectedObjectIndex = -1;
      drawCanvas();
    }
  });

  // === Start Over ===
  document.getElementById("startoverBtn").addEventListener("click", () => {
    overlays = [];
    selectedObjectIndex = -1;
    drawCanvas();
  });
});
