<script>
document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("canvas");
  if (!canvas) {
    console.error("Canvas not found.");
    return;
  }

  const ctx = canvas.getContext("2d");
  const thumbnailBar = document.getElementById("thumbnail-bar");
  canvas.width = 1500;
  canvas.height = 500;

  let overlays = [];
  let selectedObjectIndex = -1;
  let dragOffset = { x: 0, y: 0 };
  let isDragging = false;
  let isResizing = false;
  let dragHandleIndex = -1;

  function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    overlays.forEach((overlay, i) => {
      ctx.drawImage(overlay.img, overlay.x, overlay.y, overlay.width, overlay.height);
      if (i === selectedObjectIndex) drawResizeHandles(overlay);
    });
  }

  function drawResizeHandles(obj) {
    const size = 8;
    const handles = getHandlePositions(obj);
    handles.forEach(pos => {
      ctx.fillStyle = "white";
      ctx.fillRect(pos.x - size / 2, pos.y - size / 2, size, size);
      ctx.strokeStyle = "black";
      ctx.strokeRect(pos.x - size / 2, pos.y - size / 2, size, size);
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

  function handleFileUpload(event) {
    const files = event.target.files;
    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = new Image();
        img.onload = () => {
          const obj = {
            img: img,
            x: 100 + i * 50,
            y: 100,
            width: 200,
            height: 150,
            selected: false,
          };
          overlays.push(obj);
          drawCanvas();

          const thumb = document.createElement("img");
          thumb.src = e.target.result;
          thumb.style.height = "50px";
          thumb.style.marginRight = "6px";
          thumb.style.cursor = "pointer";
          thumb.onclick = () => {
            selectedObjectIndex = overlays.indexOf(obj);
            drawCanvas();
          };
          thumbnailBar.appendChild(thumb);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(files[i]);
    }
  }

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
  });

  document.getElementById("imageLoader").addEventListener("change", handleFileUpload);

  document.getElementById("exportBtn").addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = "X_Banner.png";
    link.href = canvas.toDataURL();
    link.click();
  });

  drawCanvas();
});
</script>
