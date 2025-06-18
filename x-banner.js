// Project: X Banner Editor (Full Feature Port)
// Based on YT full logic — adapted for single input, multi-load, and thumbnail tray

let canvas = document.getElementById("bannerCanvas");
let ctx = canvas.getContext("2d");
let currentImage = null;
let objects = [];
let selectedObjectIndex = -1;
let thumbnails = [];

function initCanvas() {
  canvas.width = 1600;
  canvas.height = 900;
  drawCanvas();
}

function handleFileUpload(event) {
  const files = event.target.files;
  for (let i = 0; i < files.length; i++) {
    const reader = new FileReader();
    reader.onload = function (e) {
      let img = new Image();
      img.onload = function () {
        let obj = {
          img: img,
          x: 100 + i * 10,
          y: 100 + i * 10,
          width: 200,
          height: 150,
        };
        objects.push(obj);
        thumbnails.push(e.target.result);
        updateThumbnailTray();
        drawCanvas();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(files[i]);
  }
}

function updateThumbnailTray() {
  const tray = document.getElementById("thumbnail-tray");
  tray.innerHTML = "";
  thumbnails.forEach((src, index) => {
    const thumb = document.createElement("img");
    thumb.src = src;
    thumb.className = "thumbnail";
    thumb.onclick = () => {
      selectedObjectIndex = index;
      drawCanvas();
    };
    tray.appendChild(thumb);
  });
}

function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  objects.forEach((obj, index) => {
    ctx.drawImage(obj.img, obj.x, obj.y, obj.width, obj.height);
   if (selectedObjectIndex !== -1) {
  drawHandles(objects[selectedObjectIndex]);
}

  });
}

function drawHandles(obj) {
  const size = 10;
  const handles = getHandlePositions(obj);
  ctx.fillStyle = 'cyan';
  for (let h of handles) {
    ctx.fillRect(h.x - size / 2, h.y - size / 2, size, size);
  }
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

function exportBanner() {
  let link = document.createElement("a");
  link.download = "X-banner.png";
  link.href = canvas.toDataURL();
  link.click();
}

function deleteSelectedImage() {
  if (selectedObjectIndex > -1) {
    objects.splice(selectedObjectIndex, 1);
    thumbnails.splice(selectedObjectIndex, 1);
    selectedObjectIndex = -1;
    updateThumbnailTray();
    drawCanvas();
  }
}

canvas.addEventListener("mousedown", function (e) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  selectedObjectIndex = -1;
  for (let i = objects.length - 1; i >= 0; i--) {
    let obj = objects[i];
    if (
      mouseX >= obj.x &&
      mouseX <= obj.x + obj.width &&
      mouseY >= obj.y &&
      mouseY <= obj.y + obj.height
    ) {
      selectedObjectIndex = i;
      break;
    }
  }
  drawCanvas();
});

window.onload = initCanvas;

document.addEventListener("keydown", function (e) {
  if (selectedObjectIndex === -1) return;
  let obj = objects[selectedObjectIndex];
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
    default:
      return;
  }

  drawCanvas();
});

