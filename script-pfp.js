
const uploadInput = document.getElementById('uploadPfpImage');
const zoomSlider = document.getElementById('zoomSlider');
const exportBtn = document.getElementById('exportPfp');

const previewCanvas = document.getElementById('previewCanvas');
const previewCtx = previewCanvas.getContext('2d');

const circleCanvas = document.getElementById('circleCanvas');
const circleCtx = circleCanvas.getContext('2d');

let img = new Image();
let scale = 1;
let offsetX = 0;
let offsetY = 0;
let dragging = false;
let startX, startY;

function drawPreview() {
  previewCanvas.width = img.width;
  previewCanvas.height = img.height;
  previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  previewCtx.drawImage(img, 0, 0);
}

function drawCircleCrop() {
  circleCtx.clearRect(0, 0, circleCanvas.width, circleCanvas.height);
  circleCtx.save();
  circleCtx.beginPath();
  circleCtx.arc(200, 200, 200, 0, Math.PI * 2);
  circleCtx.clip();
  circleCtx.drawImage(img, offsetX, offsetY, img.width * scale, img.height * scale);
  circleCtx.restore();
}

uploadInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    img.onload = () => {
      offsetX = 0;
      offsetY = 0;
      scale = 1;
      drawPreview();
      drawCircleCrop();
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

zoomSlider.addEventListener('input', () => {
  scale = parseFloat(zoomSlider.value);
  drawCircleCrop();
});

circleCanvas.addEventListener('mousedown', (e) => {
  dragging = true;
  startX = e.offsetX;
  startY = e.offsetY;
});

circleCanvas.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  offsetX += e.offsetX - startX;
  offsetY += e.offsetY - startY;
  startX = e.offsetX;
  startY = e.offsetY;
  drawCircleCrop();
});

circleCanvas.addEventListener('mouseup', () => dragging = false);
circleCanvas.addEventListener('mouseleave', () => dragging = false);

exportBtn.addEventListener('click', () => {
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  tempCanvas.width = 400;
  tempCanvas.height = 400;

  tempCtx.beginPath();
  tempCtx.arc(200, 200, 200, 0, Math.PI * 2);
  tempCtx.clip();
  tempCtx.drawImage(img, offsetX, offsetY, img.width * scale, img.height * scale);
  const link = document.createElement('a');
  link.download = 'cropped-pfp.png';
  link.href = tempCanvas.toDataURL();
  link.click();
});
