// Get canvas and context
const canvas = document.getElementById('pfpCanvas');
const ctx = canvas.getContext('2d');

// Upload PFP Button
document.getElementById('uploadPfpImage').addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = URL.createObjectURL(file);
  };
  input.click();
});

// Export PFP Button
document.getElementById('exportPfp').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'pfp-image.png';
  link.href = canvas.toDataURL();
  link.click();
});
