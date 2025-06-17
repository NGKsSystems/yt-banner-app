// === 🎨 Canvas Setup ===
const canvas = document.getElementById('pfpCanvas');
const ctx = canvas.getContext('2d');
let currentImg = null;

// === 📂 Upload Image and Fit to Canvas ===
function handleImageUpload() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';

  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      currentImg = img;

      // 🔄 Clear and draw image scaled + centered
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (canvas.width - w) / 2;
      const y = (canvas.height - h) / 2;

      ctx.drawImage(img, x, y, w, h);
    };
    img.src = URL.createObjectURL(file);
  };

  input.click();
}

// === 💾 Export Canvas to PNG ===
function exportPfpImage() {
  if (!currentImg) return;

  const link = document.createElement('a');
  link.download = 'pfp.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// === ⚡ Wire Up Buttons ===
document.getElementById('uploadPfpImage').addEventListener('click', handleImageUpload);
document.getElementById('exportPfp').addEventListener('click', exportPfpImage);
