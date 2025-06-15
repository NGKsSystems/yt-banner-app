window.onload = () => {
  const canvas = document.getElementById("bannerCanvas");
  const ctx = canvas.getContext("2d");

  const overlays = [];
  const handleSize = 10;
  let dragging = null, resizing = null, selectedHandle = null;
  let dragOffsetX = 0, dragOffsetY = 0;

  const bgInput = document.getElementById("bgInput");
  const skipBg = document.getElementById("skipBg");
  const mobileInput = document.getElementById("mobileInput");
  const extraInput = document.getElementById("extraInput");
  const exportBtn = document.getElementById("exportBtn");

  let currentStep = 1;

  function showStep(stepNum) {
    for (let i = 1; i <= 4; i++) {
      const el = document.getElementById(`step${i}`);
      if (el) el.classList.add("hidden");
    }
    const next = document.getElementById(`step${stepNum}`);
    if (next) next.classList.remove("hidden");
    currentStep = stepNum;
  }

  function advanceStep() {
    showStep(currentStep + 1);
  }

 function drawCanvas(showHandles = true) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const bg = overlays.find(o => o.bg);
  if (bg) ctx.drawImage(bg.img, 0, 0, canvas.width, canvas.height);

  overlays.forEach(o => {
    if (!o.bg) ctx.drawImage(o.img, o.x, o.y, o.width, o.height);

    if (showHandles) {
      ctx.strokeStyle = o.mobileSafe ? "lime" : "red";
      ctx.strokeRect(o.x, o.y, o.width, o.height);

      if (o.selected) drawHandles(o);
    }
  });
}


  function drawHandles(obj) {
    const x = obj.x, y = obj.y, w = obj.width, h = obj.height;
    const points = [
      [x, y], [x + w/2, y], [x + w, y],
      [x + w, y + h/2], [x + w, y + h],
      [x + w/2, y + h], [x, y + h],
      [x, y + h/2]
    ];
    ctx.fillStyle = "white";
    points.forEach(([px, py]) => {
      ctx.fillRect(px - handleSize/2, py - handleSize/2, handleSize, handleSize);
    });
  }

  function hitTestHandle(obj, mx, my) {
    const x = obj.x, y = obj.y, w = obj.width, h = obj.height;
    const positions = [
      [x, y], [x + w/2, y], [x + w, y],
      [x + w, y + h/2], [x + w, y + h],
      [x + w/2, y + h], [x, y + h],
      [x, y + h/2]
    ];
    for (let i = 0; i < positions.length; i++) {
      const [px, py] = positions[i];
      if (mx >= px - handleSize && mx <= px + handleSize &&
          my >= py - handleSize && my <= py + handleSize) {
        return i;
      }
    }
    return -1;
  }

  function resizeByHandle(obj, handleIndex, mx, my) {
    switch (handleIndex) {
      case 0: obj.width += obj.x - mx; obj.height += obj.y - my; obj.x = mx; obj.y = my; break;
      case 1: obj.height += obj.y - my; obj.y = my; break;
      case 2: obj.width = mx - obj.x; obj.height += obj.y - my; obj.y = my; break;
      case 3: obj.width = mx - obj.x; break;
      case 4: obj.width = mx - obj.x; obj.height = my - obj.y; break;
      case 5: obj.height = my - obj.y; break;
      case 6: obj.width += obj.x - mx; obj.height = my - obj.y; obj.x = mx; break;
      case 7: obj.width += obj.x - mx; obj.x = mx; break;
    }
  }

  canvas.addEventListener("mousedown", e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;

    let clicked = false;

    for (let i = overlays.length - 1; i >= 0; i--) {
      const o = overlays[i];
      if (o.bg) continue;

      const hIndex = hitTestHandle(o, mx, my);
      if (hIndex !== -1) {
        overlays.forEach(obj => obj.selected = false);
        resizing = o;
        selectedHandle = hIndex;
        o.selected = true;
        clicked = true;
        break;
      }

      if (mx >= o.x && mx <= o.x + o.width && my >= o.y && my <= o.y + o.height) {
        overlays.forEach(obj => obj.selected = false);
        dragging = o;
        dragOffsetX = mx - o.x;
        dragOffsetY = my - o.y;
        o.selected = true;
        clicked = true;
        break;
      }
    }

    if (!clicked) {
      overlays.forEach(obj => obj.selected = false);
    }

    drawCanvas();
  });

  canvas.addEventListener("mousemove", e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;

    if (dragging) {
      dragging.x = mx - dragOffsetX;
      dragging.y = my - dragOffsetY;
      drawCanvas();
    } else if (resizing) {
      resizeByHandle(resizing, selectedHandle, mx, my);
      drawCanvas();
    }
  });

  canvas.addEventListener("mouseup", () => {
    dragging = null;
    resizing = null;
    selectedHandle = null;
  });

  bgInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      overlays.push({ img, bg: true });
      drawCanvas();
      advanceStep();
    };
    img.src = URL.createObjectURL(file);
  });

  skipBg.addEventListener("click", () => {
    drawCanvas();
    advanceStep();
  });

  mobileInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      overlays.push({
        img,
        x: 507,
        y: 509,
        width: 1546,
        height: 423,
        mobileSafe: true
      });
      drawCanvas();
      advanceStep();
    };
    img.src = URL.createObjectURL(file);
  });

  extraInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      overlays.push({
        img,
        x: 100,
        y: 100,
        width: 300,
        height: 100
      });
      drawCanvas();
      advanceStep();
    };
    img.src = URL.createObjectURL(file);
  });

  exportBtn.addEventListener("click", () => {
    overlays.forEach(o => o.selected = false);
    drawCanvas(false);
    const link = document.createElement("a");
    link.download = "yt_banner_final.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    drawCanvas(true);
  });

  showStep(1);
};
