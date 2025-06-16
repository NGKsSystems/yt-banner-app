const canvas = document.getElementById('pfpCanvas');
const ctx = canvas.getContext('2d');

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

