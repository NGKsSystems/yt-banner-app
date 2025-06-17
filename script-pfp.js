const previewCanvas = document.getElementById("previewCanvas");
const previewCtx = previewCanvas.getContext("2d");
const uploadInput = document.getElementById("uploadPfpImage");
const zoomSlider = document.getElementById("zoomSlider");
const exportBtn = document.getElementById("exportPfp");

let img = null;
let zoom = 1;

uploadInput.addEventListener("change", (e) => {
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

// (Export function still to be added — depending on PFP overlay behavior)
