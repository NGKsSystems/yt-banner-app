const canvas = document.getElementById('editor-canvas');
const ctx = canvas.getContext('2d');
const imageLoader = document.getElementById('imageLoader');
const zoomSlider = document.getElementById('zoom');
const exportBtn = document.getElementById('export');
const layerList = document.getElementById('layerList');

let scale = 1;
let layers = [];

class Layer {
  constructor(image, id) {
    this.image = image;
    this.id = id;
    this.x = 200;
    this.y = 200;
    this.width = image.width;
    this.height = image.height;
    this.scale = 1;
    this.dragging = false;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  draw(ctx) {
    ctx.drawImage(this.image, this.x, this.y, this.width * this.scale, this.height * this.scale);
  }

  isInside(mx, my) {
    return mx >= this.x && mx <= this.x + this.width * this.scale &&
           my >= this.y && my <= this.y + this.height * this.scale;
  }
}

let activeLayer = null;

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  layers.forEach(layer => layer.draw(ctx));
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, 400, 0, Math.PI * 2);
  ctx.strokeStyle = "#0ff";
  ctx.lineWidth = 4;
  ctx.stroke();
}

imageLoader.addEventListener('change', (e) => {
  const files = e.target.files;
  for (let file of files) {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const newLayer = new Layer(img, Date.now());
        layers.push(newLayer);
        updateLayerList();
        redraw();
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  }
});

canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  for (let i = layers.length - 1; i >= 0; i--) {
    if (layers[i].isInside(mx, my)) {
      activeLayer = layers[i];
      activeLayer.dragging = true;
      activeLayer.offsetX = mx - activeLayer.x;
      activeLayer.offsetY = my - activeLayer.y;
      return;
    }
  }
});

canvas.addEventListener('mouseup', () => {
  if (activeLayer) activeLayer.dragging = false;
  activeLayer = null;
});

canvas.addEventListener('mousemove', (e) => {
  if (activeLayer && activeLayer.dragging) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    activeLayer.x = mx - activeLayer.offsetX;
    activeLayer.y = my - activeLayer.offsetY;
    redraw();
  }
});

zoomSlider.addEventListener('input', () => {
  scale = parseFloat(zoomSlider.value);
  if (activeLayer) {
    activeLayer.scale = scale;
    redraw();
  }
});

function updateLayerList() {
  layerList.innerHTML = '';
  layers.forEach((layer, index) => {
    const li = document.createElement('li');
    li.textContent = `Layer ${index + 1}`;
    const btn = document.createElement('button');
    btn.textContent = 'Remove';
    btn.onclick = () => {
      layers.splice(index, 1);
      updateLayerList();
      redraw();
    };
    li.appendChild(btn);
    layerList.appendChild(li);
  });
}

exportBtn.addEventListener('click', () => {
  const exportCanvas = document.createElement('canvas');
  const exportCtx = exportCanvas.getContext('2d');
  exportCanvas.width = 800;
  exportCanvas.height = 800;

  const sx = (canvas.width / 2) - 400;
  const sy = (canvas.height / 2) - 400;
  const imageData = ctx.getImageData(sx, sy, 800, 800);
  exportCtx.putImageData(imageData, 0, 0);

  exportCtx.globalCompositeOperation = 'destination-in';
  exportCtx.beginPath();
  exportCtx.arc(400, 400, 400, 0, Math.PI * 2);
  exportCtx.fill();

  const link = document.createElement('a');
  link.download = 'ngks_multi_pfp.png';
  link.href = exportCanvas.toDataURL('image/png');
  link.click();
});
