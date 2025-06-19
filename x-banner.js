// X Banner Editor (Full Version - DOM Safe)

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("bannerCanvas");
  if (!canvas) {
    console.error("Canvas not found.");
    return;
  }

  const ctx = canvas.getContext("2d");
  canvas.width = 1600;
  canvas.height = 900;

  initEditor(canvas, ctx);
});

function initEditor(canvas, ctx) {
  let overlays = [];
  let selectedObjectIndex = -1;
  let dragStart = null;
  let dragOffset = { x: 0, y: 0 };
  let isDragging = false;
  let isResizing = false;
  let dragHandleIndex = -1;
  let startX = 0;
  let startY = 0;

  // === Draw Overlays ===
  function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    overlays.forEach((overlay, i) => {
      ctx.drawImage(overlay.img, overlay.x, overlay.y, overlay.width, overlay.height);
      if (i === selectedObjectIndex) drawResizeHandles(overlay);
    });
  }

  // === Resize Handle Drawing ===
  function drawResizeHandles(obj) {
    const handles = getHandlePositions(obj);
    ctx.fillStyle = "white";
    handles.forEach(({ x, y }) => {
      ctx.fillRect(x - 5, y - 5, 10, 10);
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
      { x: x + w, y: y + h }
    ];
  }

  // === File Upload Handler ===
  document.getElementById("imageLoader").addEventListener("change", function (e) {
    const files = e.target.files;
    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();
      reader.onload = function (event) {
        const img = new Image();
        img.onload = function () {
          const obj = {
            img: img,
            x: 100 + i * 20,
            y: 100 + i * 20,
            width: 200,
            height: 150,
            selected: false
          };
          overlays.push(obj);
          drawCanvas();
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(files[i]);
    }
  });

  // === Mousedown ===
  canvas.addEventListener("mousedown", function (e) {
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

        const handles = getHandlePositions(obj);
        for (let j = 0; j < handles.length; j++) {
          const hx = handles[j].x;
          const hy = handles[j].y;
          if (Math.abs(mouseX - hx) < 8 && Math.abs(mouseY - hy) < 8) {
            isResizing = true;
            dragHandleIndex = j;
            break;
          }
        }

        if (!isResizing) {
          isDragging = true;
          dragOffset = { x: mouseX - obj.x, y: mouseY - obj.y };
        }

        startX = mouseX;
        startY = mouseY;
        break;
      }
    }
    drawCanvas();
  });

  // === Mousemove ===
  canvas.addEventListener("mousemove", function (e) {
    if (selectedObjectIndex === -1) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const obj = overlays[selectedObjectIndex];

    if (isDragging) {
      obj.x = mouseX - dragOffset.x;
      obj.y = mouseY - dragOffset.y;
    }

    if (isResizing) {
      const dx = mouseX - startX;
      const dy = mouseY - startY;
      if (dragHandleIndex === 2 || dragHandleIndex === 4 || dragHandleIndex === 7) {
        obj.width += dx;
      }
      if (dragHandleIndex === 5 || dragHandleIndex === 6 || dragHandleIndex === 7) {
        obj.height += dy;
      }
      startX = mouseX;
      startY = mouseY;
    }

    drawCanvas();
  });

  // === Mouseup ===
  canvas.addEventListener("mouseup", function () {
    isDragging = false;
    isResizing = false;
  });

  // === Arrow Key Movement ===
  document.addEventListener("keydown", function (e) {
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
    }
    drawCanvas();
  });

  // === Export ===
  document.getElementById("downloadBtn").addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = "x-banner.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  });

  // === Start Over ===
  document.getElementById("startoverBtn")?.addEventListener("click", () => {
    overlays = [];
    selectedObjectIndex = -1;
    drawCanvas();
  });

  // === Delete Selected ===
  document.getElementById("deleteBtn")?.addEventListener("click", () => {
    if (selectedObjectIndex > -1) {
      overlays.splice(selectedObjectIndex, 1);
      selectedObjectIndex = -1;
      drawCanvas();
    }
  });

  drawCanvas();
}
