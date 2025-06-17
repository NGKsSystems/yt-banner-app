const previewCanvas = document.getElementById('previewCanvas');
const previewCtx = previewCanvas.getContext('2d');

const overlayCanvas = document.getElementById('circleOverlay');
const overlayCtx = overlayCanvas.getContext('2d');

const fileInput = document.getElementById('uploadPfpImage');
const zoomSlider = document.getElementById('zoomSlider');
const exportBtn = document.getElementById('exportPfp');

let img = new Image();
let zoom = 1;

function drawOverlay() {
  overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  overlayCtx.beginPath();
  overlayCtx.arc(250, 250, 150, 0, Math.PI * 2);
  overlayCtx.strokeStyle = '#aaa';
  overlayCtx.lineWidth = 2;
  overlayCtx.stroke();
}

function drawImage() {
  if (!img.src) return;
  const w = img.width * zoom;
  const h = img.height * zoom;
  const x = (previewCanvas.width - w) / 2;
  const y = (previewCanvas.height - h) / 2;

  previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  previewCtx.drawImage(img, x, y, w, h);
}

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  img = new Image();
  img.onload = () => {
    drawImage();
    drawOverlay();
  };
  img.src = URL.createObjectURL(file);
});

zoomSlider.addEventListener('input', () => {
  zoom = parseFloat(zoomSlider.value);
  drawImage();
  drawOverlay();
});

exportBtn.addEventListener('click', () => {
  const r = 150;
  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = r * 2;
  cropCanvas.height = r * 2;

  const ctx = cropCanvas.getContext('2d');
  ctx.beginPath();
  ctx.arc(r, r, r, 0, Math.PI * 2);
  ctx.clip();

  const sx = (previewCanvas.width / 2) - r;
  const sy = (previewCanvas.height / 2) - r;
  ctx.drawImage(previewCanvas, sx, sy, r * 2, r * 2, 0, 0, r * 2, r * 2);

  const link = document.createElement('a');
  link.href = cropCanvas.toDataURL('image/png');
  link.download = 'pfp.png';
  link.click();
});
