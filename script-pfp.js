const previewCanvas = document.getElementById("previewCanvas");
const previewCtx = previewCanvas.getContext("2d");
const zoomSlider = document.getElementById("zoomSlider");
const exportBtn = document.getElementById("exportPfp");

let img = null;
let zoom = 1;

document.getElementById("uploadPfpImage").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    img = new Image();
    img.onload = () => {
      drawPreview();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

zoomSlider.addEventListener("input", () => {
  zoom = parseFloat(zoomSlider.value);
  drawPreview();
});

function drawPreview() {
  if (!img) return;

  previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

  const scaledWidth = img.width * zoom;
  const scaledHeight = img.height * zoom;

  const x = (previewCanvas.width - scaledWidth) / 2;
  const y = (previewCanvas.height - scaledHeight) / 2;

  previewCtx.drawImage(img, x, y, scaledWidth, scaledHeight);
}

// 🟢 Export logic: Crop circle area from previewCanvas
exportBtn.addEventListener("click", () => {
  const size = 500; // size of circle
  const offsetX = (previewCanvas.width - size) / 2;
  const offsetY = (previewCanvas.height - size) / 2;

  const output = document.createElement("canvas");
  output.width = size;
  output.height = size;
  const ctx = output.getContext("2d");

  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  ctx.drawImage(previewCanvas, offsetX, offsetY, size, size, 0, 0, size, size);

  const link = document.createElement("a");
  link.download = "pfp.png";
  link.href = output.toDataURL("image/png");
  link.click();
});
