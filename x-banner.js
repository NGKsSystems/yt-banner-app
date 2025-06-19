// === X Banner Editor Full Build ===
// Features: Multiple uploads, canvas-only draw, thumbnails, resize/drag/delete, export

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("canvas"); // <-- Make sure HTML matches this ID
  if (!canvas) {
    console.error("Canvas not found.");
    return;
  }

  const ctx = canvas.getContext("2d");
  canvas.width = 1600;
  canvas.height = 900;

  const fileInput = document.getElementById("imageLoader");
  const exportBtn = document.getElementById("exportBtn");
  const deleteBtn = document.getElementById("deleteBtn");
  const startoverBtn = document.getElementById("startoverBtn");
  const thumbnailBar = document.getElementById("thumbnail-bar");

  let overlays = [];
  let selectedObjectIndex = -1;
  let dragOffset = { x: 0, y: 0 };
  let isDragging = false;
  let isResizing = false;
  let dragHandleIndex = -1;

  // === Draw Loop ===
  function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    overlays.forEach((ov, i) => {
      ctx.drawImage(ov.img, ov.x, ov.y, ov.width, ov.height);
      if (i === selectedObjectIndex) drawResizeHandles(ov);
    });
  }

  // === Resize Handle Drawing ===
  function drawResizeHandles(obj) {
    const handles = getHandlePositions(obj);
    handles.forEach(pt => {
      ctx.fillStyle = "white";
      ctx.fillRect(pt.x - 4, pt.y - 4, 8, 8);
    });
  }

  function getHandlePositions(obj) {
    const { x, y, width: w, height: h } = obj;
    return [
      { x, y },                         // top-left
      { x: x + w / 2, y },              // top-center
      { x: x + w, y },                  // top-right
      { x, y: y + h / 2 },              // middle-left
      { x: x + w, y: y + h / 2 },       // middle-right
      { x, y: y + h },                  // bottom-left
      { x: x + w / 2, y: y + h },       // bottom-center
      { x: x + w, y: y + h },           // bottom-right
    ];
  }

  // === File Upload Handler ===
  fileInput.addEventListener("change", (e) => {
    const files = e.target.files;
    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const obj = {
            img,
            x: 100 + (index * 30),
            y: 100 + (index * 30),
            width: 300,
            height: 200
          };
          overlays.push(obj);
          addThumbnail(img, overlays.length - 1);
          drawCanvas();
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  });

  // === Add Thumbnails ===
  function addThumbnail(img, index) {
    const thumb = document.createElement("img");
    thumb.src = img.src;
    thumb.classList.add("thumbnail");
    thumb.onclick = () => {
      selectedObjectIndex = index;
      drawCanvas();
    };
    thumbnailBar.appendChild(thumb);
  }

  // === Mouse Events ===
  canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    selectedObjectIndex = -1;
    for (let i = overlays.length - 1; i >= 0; i--) {
      const ov = overlays[i];
      if (
        mouseX >= ov.x && mouseX <= ov.x + ov.width &&
        mouseY >= ov.y && mouseY <= ov.y + ov.height
      ) {
        selectedObjectIndex = i;
        dragOffset = { x: mouseX - ov.x, y: mouseY - ov.y };

        const handles = getHandlePositions(ov);
        handles.forEach((pt, idx) => {
          if (
            mouseX >= pt.x - 6 && mouseX <= pt.x + 6 &&
            mouseY >= pt.y - 6 && mouseY <= pt.y + 6
          ) {
            isResizing = true;
            dragHandleIndex = idx;
          }
        });

        isDragging = !isResizing;
        break;
      }
    }
    drawCanvas();
  });

  canvas.addEventListener("mousemove", (e) => {
    if (selectedObjectIndex === -1) return;
    const ov = overlays[selectedObjectIndex];
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (isDragging) {
      ov.x = mx - dragOffset.x;
      ov.y = my - dragOffset.y;
    } else if (isResizing) {
      const dx = mx - ov.x;
      const dy = my - ov.y;
      ov.width = Math.max(50, dx);
      ov.height = Math.max(50, dy);
    }
    drawCanvas();
  });

  canvas.addEventListener("mouseup", () => {
    isDragging = false;
    isResizing = false;
    dragHandleIndex = -1;
  });

  // === Arrow Keys Movement ===
  document.addEventListener("keydown", (e) => {
    const step = 5;
    const ov = overlays[selectedObjectIndex];
    if (!ov) return;

    switch (e.key) {
      case "ArrowUp": ov.y -= step; break;
      case "ArrowDown": ov.y += step; break;
      case "ArrowLeft": ov.x -= step; break;
      case "ArrowRight": ov.x += step; break;
    }
    drawCanvas();
  });

  // === Export Button ===
  exportBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = "banner.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  });

  // === Delete Button ===
  deleteBtn.addEventListener("click", () => {
    if (selectedObjectIndex > -1) {
      overlays.splice(selectedObjectIndex, 1);
      thumbnailBar.removeChild(thumbnailBar.children[selectedObjectIndex]);
      selectedObjectIndex = -1;
      drawCanvas();
    }
  });

  // === Start Over Button ===
  startoverBtn.addEventListener("click", () => {
    overlays = [];
    selectedObjectIndex = -1;
    thumbnailBar.innerHTML = "";
    drawCanvas();
  });
});
