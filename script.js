const canvas = new fabric.Canvas('bannerCanvas', {
    preserveObjectStacking: true
});

const zoomSelect = document.getElementById("zoomSelect");
zoomSelect.addEventListener("change", () => {
    const scale = parseFloat(zoomSelect.value);
    canvas.setZoom(scale);
});

document.getElementById('imageUpload').addEventListener('change', function (e) {
    [...e.target.files].forEach(file => {
        const reader = new FileReader();
        reader.onload = function (f) {
            const img = document.createElement("img");
            img.src = f.target.result;
            img.addEventListener("click", () => {
                fabric.Image.fromURL(f.target.result, function (imgObj) {
                    imgObj.set({ left: 100, top: 100, scaleX: 0.5, scaleY: 0.5 });
                    canvas.add(imgObj);
                });
            });
            document.getElementById("thumbnails").appendChild(img);
        };
        reader.readAsDataURL(file);
    });
});

document.getElementById("exportBtn").addEventListener("click", () => {
    canvas.discardActiveObject();
    canvas.renderAll();
    const link = document.createElement("a");
    link.download = "yt_banner.png";
    canvas.lowerCanvasEl.toBlob(function (blob) {
        link.href = URL.createObjectURL(blob);
        link.click();
    });
});
