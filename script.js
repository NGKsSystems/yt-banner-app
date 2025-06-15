<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NGKs Banner Editor</title>
  <style>
    body {
      background-color: #111;
      color: #fff;
      font-family: Arial, sans-serif;
      text-align: center;
    }
    canvas {
      border: 2px solid yellow;
      margin: 20px auto;
      display: block;
    }
    .step-line {
      margin: 20px;
    }
    .step-line span {
      margin: 0 10px;
    }
  </style>
</head>
<body>
  <h2>NGKs Banner Editor</h2>

  <div class="step-line">
    Step 1: Choose your background
    <input type="file" id="backgroundInput" accept="image/*" />
    <span>or</span>
    <button id="skipBtn">Skip</button>
  </div>

  <canvas id="bannerCanvas" width="2560" height="1440"></canvas>

  <script>
    const canvas = document.getElementById('bannerCanvas');
    const ctx = canvas.getContext('2d');
    const backgroundInput = document.getElementById('backgroundInput');
    const skipBtn = document.getElementById('skipBtn');

    backgroundInput.addEventListener('change', () => {
      const file = backgroundInput.files[0];
      if (!file) return;
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        drawSafeZones();
      };
      img.src = URL.createObjectURL(file);
    });

    skipBtn.addEventListener('click', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawSafeZones();
    });

    function drawSafeZones() {
      // Outer TV zone
      ctx.strokeStyle = 'yellow';
      ctx.strokeRect(0, 0, canvas.width, canvas.height);

      // Mobile safe zone
      ctx.strokeStyle = 'lime';
      ctx.strokeRect(740, 620, 1080, 200);
    }
  </script>
</body>
</html>
