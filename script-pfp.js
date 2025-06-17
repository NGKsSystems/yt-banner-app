const canvas = document.getElementById('pfpCanvas');
const ctx = canvas.getContext('2d');

let uploadedImage = null;

document.getElementById('uploadPfpImage').addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';

  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      uploadedImage = img;

      // Fit image inside canvas
      const scale = Math.min(
        canvas.width / img.width,
        canvas.height / img.height
      );
      const newWidth = img.width * scale;
      const newHeight = img.height * scale;
      const x = (canvas.width - newWidth) / 2;
      const y = (canvas.height - newHeight) / 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, x, y, newWidth, newHeight);
    };

    img.src = URL.createObjectURL(file);
  };

  input.click();
});

document.getElementById('exportPfp').addEventListener('click', () => {
  if (!uploadedImage) return;

  // Extract circular region from center of canvas
  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = 800;
  cropCanvas.height = 800;
  const cropCtx = cropCanvas.getContext('2d');

  cropCtx.save();
  cropCtx.beginPath();
  cropCtx.arc(400, 400, 400, 0, Math.PI * 2);
  cropCtx.closePath();
  cropCtx.clip();

  cropCtx.drawImage(canvas, 0, 0);
  cropCtx.restore();

  const link = document.createElement('a');
  link.download = 'pfp.png';
  link.href = cropCanvas.toDataURL('image/png');
  link.click();
});
