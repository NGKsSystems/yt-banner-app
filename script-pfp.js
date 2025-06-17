const previewCanvas = document.getElementById('previewCanvas');
const circleCanvas = document.getElementById('circleCanvas');
const ctxPreview = previewCanvas.getContext('2d');
const ctxCircle = circleCanvas.getContext('2d');
const zoomSlider = document.getElementById('zoomSlider');

let img = null;
let zoom = 1;
let offsetX = 0;
let offsetY = 0;
let dragging = false;
let dragStartX = 0;
let dragStartY = 0;

// Load image
document.getElementById('uploadPfpImage').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    img = new Image();
    img.onload = () => {
      offsetX = 0;
      offsetY = 0;
      zoom = 1;
      drawPreview();
      drawCircle();
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

// Zoom handler
zoomSlider.addEventListener('input', () => {
  zoom = parseFloat(zoomSlider.value);
  drawPreview();
  drawCircle();
});

// Drag logic
circleCanvas.addEventListener('mousedown', (e) => {
  dragging = true;
  dragStartX = e.offsetX;
  dragStartY = e.offsetY;
});

window.addEventListener('mouseup', () => dragging = false);

circleCanvas.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  const dx = e.offsetX - dragStartX;
  const dy = e.offsetY - dragStartY;
  offsetX += dx;
  offsetY += dy;
  dragStartX = e.offsetX;
  dragStartY = e.offsetY;
  drawPreview();
  drawCircle();
});

// Drawing logic
function drawPreview() {
  ctxPreview.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  if (img) {
    const w = img.width * zoom;
    const h = img.height * zoom;
    ctxPreview.drawImage(img, offsetX, offsetY, w, h);
  }
}

function drawCircle() {
  ctxCircle.clearRect(0, 0, circleCanvas.width, circleCanvas.height);
  if (!img) return;

  const w = img.width * zoom;
  const h = img.height * zoom;

  ctxCircle.save();
  ctxCircle.beginPath();
  ctxCircle.arc(150, 150, 150, 0, Math.PI * 2);
  ctxCircle.clip();
  ctxCircle.drawImage(img, offsetX, offsetY, w, h);
  ctxCircle.restore();
}

// Export cropped circle
document.getElementById('exportPfp').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'cropped-pfp.png';
  link.href = circleCanvas.toDataURL('image/png');
  link.click();
});
