// === X Banner Editor — Clean Logic Patch ===
// ✅ Multi-upload, thumbnail-only load, canvas on-click, no shared refs

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("xCanvas");
  if (!canvas) return console.error("Canvas not found.");
  const ctx = canvas.getContext("2d");

  canvas.width = 1600;
  canvas.height = 900;

  let objects = [];
  let selectedObjectIndex = -1;
  const thumbnails = [];

  const fileInput = document.getElementById("imageLoader");
  const thumbnailBar = document.getElementById("thumbnail-bar");
  const deleteBtn = document.getElementById("deleteBtn");
  const exportBtn = document.getElementById("exportBtn");

  function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    objects.forEach((obj, i) => {
      ctx.drawImage(obj.img, obj.x, obj.y, obj.width, obj.height);
      if (i === selectedObjectIndex) drawResizeHandles(obj);
    });
  }

  function drawResizeHandles(obj) {
    const handleSize = 6;
    ctx.fillStyle = "white";
    const handles = getHandlePositions(obj);
    handles.forEach(({ x, y }) => {
      ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
    });
  }

  function getHandlePositions(obj) {
    const { x, y, width: w, height: h } = obj;
    return [
      { x: x, y: y }, { x: x + w / 2, y: y }, { x: x + w, y: y },
      { x: x, y: y + h / 2 },               { x: x + w, y: y + h / 2 },
      { x: x, y: y + h }, { x: x + w / 2, y: y + h }, { x: x + w, y: y + h }
    ];
  }

  fileInput.addEventListener("change", (e) => {
    const files = e.target.files;
    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();
      reader.onload = function (event) {
        const img = new Image();
        img.onload = function () {
          thumbnails.push(img);
          renderThumbnail(img);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(files[i]);
    }
  });

  function renderThumbnail(img) {
    const thumb = document.createElement("img");
    thumb.src = img.src;
    thumb.className = "thumbnail";
    thumb.style.width = "60px";
    thumb.style.margin = "4px";
    thumb.style.cursor = "pointer";

    thumb.addEventListener("click", () => {
      const canvasImg = new Image();
      canvasImg.onload = () => {
        const obj = {
          img: canvasImg,
          x: 200 + objects.length * 20,
          y: 100 + objects.length * 20,
          width: 200,
          height: 150
        };
        objects.push(obj);
        drawCanvas();
      };
      canvasImg.src = img.src;
    });

    thumbnailBar.appendChild(thumb);
  }

  deleteBtn.addEventListener("click", () => {
    if (selectedObjectIndex !== -1) {
      objects.splice(selectedObjectIndex, 1);
      selectedObjectIndex = -1;
      drawCanvas();
    }
  });

  exportBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = "x-banner.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  });

  // === Dragging + Selection ===
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };

  canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    selectedObjectIndex = -1;
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      if (mouseX >= obj.x && mouseX <= obj.x + obj.width &&
          mouseY >= obj.y && mouseY <= obj.y + obj.height) {
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

    const obj = objects[selectedObjectIndex];
    obj.x = mouseX - dragOffset.x;
    obj.y = mouseY - dragOffset.y;

    drawCanvas();
  });

  canvas.addEventListener("mouseup", () => {
    isDragging = false;
  });

  document.addEventListener("keydown", (e) => {
    if (selectedObjectIndex === -1) return;
    const obj = objects[selectedObjectIndex];
    const step = 5;

    switch (e.key) {
      case "ArrowUp": obj.y -= step; break;
      case "ArrowDown": obj.y += step; break;
      case "ArrowLeft": obj.x -= step; break;
      case "ArrowRight": obj.x += step; break;
      default: return;
    }

    drawCanvas();
  });
});
