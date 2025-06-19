// === X Banner Editor – Full Drop-in ===

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("canvas");
  if (!canvas) {
    console.error("Canvas not found.");
    return;
  }

  const ctx = canvas.getContext("2d");
  canvas.width = 1600;
  canvas.height = 900;

  let objects = [];
  let selectedObjectIndex = -1;
  let isDragging = false;
  let isResizing = false;
  let dragOffset = { x: 0, y: 0 };
  let dragHandleIndex = -1;

  const thumbnailBar = document.getElementById("thumbnail-bar");

  function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    objects.forEach((obj, i) => {
      ctx.drawImage(obj.img, obj.x, obj.y, obj.width, obj.height);
      if (i === selectedObjectIndex) drawResizeHandles(obj);
    });
  }

  function drawResizeHandles(obj) {
    const handles = getHandlePositions(obj);
    ctx.fillStyle = "white";
    handles.forEach(h => ctx.fillRect(h.x - 4, h.y - 4, 8, 8));
  }

  function getHandlePositions(obj) {
    const { x, y, width: w, height: h } = obj;
    return [
      { x, y }, { x: x + w / 2, y }, { x: x + w, y },
      { x, y: y + h / 2 }, { x: x + w, y: y + h / 2 },
      { x, y: y + h }, { x: x + w / 2, y: y + h }, { x: x + w, y: y + h }
    ];
  }

  function hitTestHandle(mouseX, mouseY, handles) {
    for (let i = 0; i < handles.length; i++) {
      const h = handles[i];
      if (mouseX >= h.x - 6 && mouseX <= h.x + 6 && mouseY >= h.y - 6 && mouseY <= h.y + 6) {
        return i;
      }
    }
    return -1;
  }

  canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      const handles = getHandlePositions(obj);
      const handleIndex = hitTestHandle(mouseX, mouseY, handles);
      if (handleIndex !== -1) {
        selectedObjectIndex = i;
        dragHandleIndex = handleIndex;
        isResizing = true;
        return;
      }
      if (mouseX >= obj.x && mouseX <= obj.x + obj.width &&
          mouseY >= obj.y && mouseY <= obj.y + obj.height) {
        selectedObjectIndex = i;
        dragOffset = { x: mouseX - obj.x, y: mouseY - obj.y };
        isDragging = true;
        drawCanvas();
        return;
      }
    }
    selectedObjectIndex = -1;
    drawCanvas();
  });

  canvas.addEventListener("mousemove", (e) => {
    if (selectedObjectIndex === -1) return;
    const obj = objects[selectedObjectIndex];
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging) {
      obj.x = mouseX - dragOffset.x;
      obj.y = mouseY - dragOffset.y;
    }

    if (isResizing) {
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

  // Keyboard Arrow Nudging
  document.addEventListener("keydown", function (e) {
    if (selectedObjectIndex === -1) return;
    let obj = objects[selectedObjectIndex];
    const step = 5;
    switch (e.key) {
      case "ArrowUp": obj.y -= step; break;
      case "ArrowDown": obj.y += step; break;
      case "ArrowLeft": obj.x -= step; break;
      case "ArrowRight": obj.x += step; break;
    }
    drawCanvas();
  });

  // === File Upload ===
  document.getElementById("imageLoader").addEventListener("change", function (e) {
    const files = e.target.files;
    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();
      reader.onload = function (event) {
        const img = new Image();
        img.onload = function () {
          const obj = {
            img,
            x: 100 + (i * 40),
            y: 100 + (i * 40),
            width: img.width / 3,
            height: img.height / 3
          };
          objects.push(obj);
          selectedObjectIndex = objects.length - 1;
          addThumbnail(img, selectedObjectIndex);
          drawCanvas();
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(files[i]);
    }
  });

  function addThumbnail(img, index) {
    const thumb = document.createElement("img");
    thumb.src = img.src;
    thumb.className = "thumbnail";
    thumb.onclick = () => {
      selectedObjectIndex = index;
      drawCanvas();
    };
    thumbnailBar.appendChild(thumb);
  }

  // === Export ===
  document.getElementById("exportBtn").addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = "banner.png";
    link.href = canvas.toDataURL();
    link.click();
  });

  // === Start Over ===
  document.getElementById("startoverBtn").addEventListener("click", () => {
    objects = [];
    selectedObjectIndex = -1;
    thumbnailBar.innerHTML = "";
    drawCanvas();
  });

  // === Delete Selected ===
  document.getElementById("deleteBtn").addEventListener("click", () => {
    if (selectedObjectIndex !== -1) {
      objects.splice(selectedObjectIndex, 1);
      thumbnailBar.removeChild(thumbnailBar.childNodes[selectedObjectIndex]);
      selectedObjectIndex = -1;
      drawCanvas();
    }
  });

});
