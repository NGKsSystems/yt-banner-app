const canvas = document.getElementById('pfpCanvas');
const ctx = canvas.getContext('2d');

let pfpImage = null;

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

      const scale = Math.min(
        canvas.width / img.width,
        canvas.height / img.height
      );

      const x = (canvas.width - img.width * scale) / 2;
      const y = (canvas.height - img.height * scale) / 2;

      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      pfpImage = img;
    };

    img.src = URL.createObjectURL(file);
  };

  input.click();
});

document.getElementById('exportPfp').addEventListener('click', () => {
  if (!pfpImage) return;

  const link = document.createElement('a');
  link.download = 'pfp.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});
