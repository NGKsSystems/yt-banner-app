const previewCanvas = document.getElementById('previewCanvas');
const previewCtx = previewCanvas.getContext('2d');

const circleCanvas = document.getElementById('circleOverlay');
const circleCtx = circleCanvas.getContext('2d');

const uploadInput = document.getElementById('uploadPfpImage');
const zoomSlider = document.getElementById('zoomSlider');
const exportBtn = document.getElementById('exportPfp');

let image = null;
let zoom = 1;

function drawImage() {
  if (!image) return;
  const w = image.width * zoom;
  const h = image.height * zoom;
  const x = (previewCanvas.width - w) / 2;
  const y = (previewCanvas.height - h) / 2;

  previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  previewCtx.drawImage(image, x, y, w, h);
}

function drawOverlay() {
  circleCtx.clearRect(0, 0, circleCanvas.width, circleCanvas.height);
  circleCtx.beginPath();
  circleCtx.arc(circleCanvas.width / 2, circleCanvas.height / 2, 150, 0, Math.PI * 2);
  circleCtx.strokeStyle = '#aaa';
  circleCtx.lineWidth = 2;
  circleCtx.stroke();
}

uploadInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const img = new Image();
  img.onload = () => {
    image = img;
    drawImage();
    drawOverlay();
  };
  img.src = URL.createObjectURL(file);
});

zoomSlider.addEventListener('input', (e) => {
  zoom = parseFloat(e.target.value);
  drawImage();
  drawOverlay();
});

exportBtn.addEventListener('click', () => {
  const r = 150;
  const x = (previewCanvas.width / 2) - r;
  const y = (previewCanvas.height / 2) - r;

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = r * 2;
  cropCanvas.height = r * 2;

  const cropCtx = cropCanvas.getContext('2d');
  cropCtx.beginPath();
  cropCtx.arc(r, r, r, 0, Math.PI * 2);
  cropCtx.clip();
  cropCtx.drawImage(previewCanvas, x, y, r * 2, r * 2, 0, 0, r * 2, r * 2);

  const link = document.createElement('a');
  link.href = cropCanvas.toDataURL('image/png');
  link.download = 'pfp.png';
  link.click();
});
