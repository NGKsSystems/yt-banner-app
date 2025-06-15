
let currentStep = 1;
let dragTarget = null;
let offsetX, offsetY;
let resizeTarget = null;
let startX, startY, startWidth, startHeight;

function showStep(stepNumber) {
  document.querySelectorAll('.step').forEach((el, i) => {
    el.classList.toggle('hidden', i + 1 !== stepNumber);
  });
}

document.getElementById("nextBtn").addEventListener("click", () => {
  if (currentStep < 4) currentStep++;
  showStep(currentStep);
});

document.getElementById("prevBtn").addEventListener("click", () => {
  if (currentStep > 1) currentStep--;
  showStep(currentStep);
});

function makeDraggable(el) {
  el.addEventListener("mousedown", (e) => {
    dragTarget = el;
    offsetX = e.clientX - el.offsetLeft;
    offsetY = e.clientY - el.offsetTop;
  });

  document.addEventListener("mousemove", (e) => {
    if (dragTarget) {
      dragTarget.style.left = (e.clientX - offsetX) + "px";
      dragTarget.style.top = (e.clientY - offsetY) + "px";
    }
  });

  document.addEventListener("mouseup", () => {
    dragTarget = null;
  });
}

document.querySelectorAll('.resize-handle').forEach(handle => {
  handle.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    resizeTarget = handle.parentElement;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = resizeTarget.offsetWidth;
    startHeight = resizeTarget.offsetHeight;

    function resizeMouseMove(e) {
      const newWidth = startWidth + (e.clientX - startX);
      const newHeight = startHeight + (e.clientY - startY);
      resizeTarget.style.width = newWidth + "px";
      resizeTarget.style.height = newHeight + "px";
    }

    function stopResize() {
      document.removeEventListener("mousemove", resizeMouseMove);
      document.removeEventListener("mouseup", stopResize);
    }

    document.addEventListener("mousemove", resizeMouseMove);
    document.addEventListener("mouseup", stopResize);
  });
});
// Step navigation state

function showStep(stepNum) {
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`step${i}`);
    if (el) el.classList.add("hidden");
  }
  const next = document.getElementById(`step${stepNum}`);
  if (next) next.classList.remove("hidden");
  currentStep = stepNum;
}

function advanceStep(delta) {
  const newStep = currentStep + delta;
  if (newStep >= 1 && newStep <= 4) {
    showStep(newStep);
  }
}

document.addEventListener("click", (e) => {
  if (e.target.id === "nextBtn") {
    advanceStep(1);
  } else if (e.target.id === "prevBtn") {
    advanceStep(-1);
  } else if (e.target.id === "skipBg") {
    advanceStep(1);
  }
});

// Initialize step 1 on load
showStep(1);
window.advanceStep = advanceStep;
