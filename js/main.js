const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d');
const overlayCanvas = document.createElement('canvas');
const overlayCtx = overlayCanvas.getContext('2d');
const currentTypeSpan = document.getElementById('currentType');
const sizeLabel = document.getElementById('sizeLabel');
const colorPicker = document.getElementById('colorPicker');
const clearBtn = document.getElementById('clearBtn');
const backBtn = document.getElementById('backBtn');
const skipBtn = document.getElementById('skipBtn');
const continueBtn = document.getElementById('continueBtn');
const downloadBtn = document.getElementById('downloadBtn');
const stepButtons = document.getElementById('stepButtons');
const donateBtn = document.getElementById('donateBtn');
const donateMenu = document.getElementById('donateMenu');
const themeToggle = document.getElementById('themeToggle');
const copyBtns = document.querySelectorAll('.copy-btn');
const startScreen = document.getElementById('startScreen');
const editor = document.getElementById('editor');
const sizeSelect = document.getElementById('sizeSelect');
const startBtn = document.getElementById('startBtn');
const logo = document.getElementById('logo');
const pencilTool = document.getElementById('pencilTool');
const eraserTool = document.getElementById('eraserTool');
const fillTool = document.getElementById('fillTool');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const brushSize = document.getElementById('brushSize');
const brushSizeLabel = document.getElementById('brushSizeLabel');
const canvasContainer = document.getElementById('canvasContainer');

let drawings = {};
let currentTypeIndex = 0;
let isDrawn = false;
let cursorSize = 32;
let currentTool = 'pencil';
let zoomLevel = 1;
let savedImageData = null;
let currentBrushSize = 1;
let offsetX = 0;
let offsetY = 0;
let isPanning = false;
let panStartX = 0;
let panStartY = 0;

canvasContainer.appendChild(overlayCanvas);
overlayCanvas.style.position = 'absolute';
overlayCanvas.style.pointerEvents = 'none';
overlayCanvas.style.display = 'none';

function saveCurrentImageData() {
  savedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function restoreImageData() {
  if (savedImageData) {
    ctx.putImageData(savedImageData, 0, 0);
  }
}

function updateCanvasDisplay() {
  canvas.style.width = cursorSize * 16 * zoomLevel + 'px';
  canvas.style.height = cursorSize * 16 * zoomLevel + 'px';
  canvas.style.transform = 'translate(' + offsetX + 'px, ' + offsetY + 'px)';
}

function setCanvasSize(size) {
  cursorSize = size;
  canvas.width = size;
  canvas.height = size;
  overlayCanvas.width = size;
  overlayCanvas.height = size;
  brushSize.max = size;
  brushSize.value = 1;
  currentBrushSize = 1;
  brushSizeLabel.textContent = '1';
  updateCanvasDisplay();
  sizeLabel.textContent = 'Size: ' + size + '×' + size;
}

function drawDefaultCursorBackground() {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const currentType = cursorTypes[currentTypeIndex];
  const s = canvas.width / 32;
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#000000';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  switch(currentType.id) {
    case 'normal':
    case 'precision':
    case 'altselect':
      ctx.beginPath();
      ctx.moveTo(2*s, 2*s);
      ctx.lineTo(2*s, 20*s);
      ctx.lineTo(6*s, 15*s);
      ctx.lineTo(10*s, 25*s);
      ctx.lineTo(13*s, 23*s);
      ctx.lineTo(9*s, 13*s);
      ctx.lineTo(15*s, 13*s);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case 'help':
      ctx.beginPath();
      ctx.moveTo(2*s, 2*s);
      ctx.lineTo(2*s, 20*s);
      ctx.lineTo(6*s, 15*s);
      ctx.lineTo(10*s, 25*s);
      ctx.lineTo(13*s, 23*s);
      ctx.lineTo(9*s, 13*s);
      ctx.lineTo(15*s, 13*s);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.font = (9*s) + 'px Arial';
      ctx.fillText('?', 17*s, 17*s);
      break;
    case 'background':
      ctx.beginPath();
      ctx.moveTo(2*s, 2*s);
      ctx.lineTo(2*s, 20*s);
      ctx.lineTo(6*s, 15*s);
      ctx.lineTo(10*s, 25*s);
      ctx.lineTo(13*s, 23*s);
      ctx.lineTo(9*s, 13*s);
      ctx.lineTo(15*s, 13*s);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(20*s, 20*s, 6*s, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    case 'busy':
      ctx.beginPath();
      ctx.arc(16*s, 16*s, 6*s, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(22*s, 16*s, 6*s, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    case 'text':
      ctx.beginPath();
      ctx.moveTo(4*s, 4*s);
      ctx.lineTo(4*s, 22*s);
      ctx.lineTo(8*s, 22*s);
      ctx.lineTo(8*s, 14*s);
      ctx.lineTo(18*s, 14*s);
      ctx.lineTo(18*s, 22*s);
      ctx.lineTo(22*s, 22*s);
      ctx.lineTo(22*s, 4*s);
      ctx.lineTo(18*s, 4*s);
      ctx.lineTo(18*s, 10*s);
      ctx.lineTo(8*s, 10*s);
      ctx.lineTo(8*s, 4*s);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case 'handwriting':
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(4*s, 20*s);
      ctx.lineTo(8*s, 8*s);
      ctx.lineTo(12*s, 22*s);
      ctx.lineTo(16*s, 6*s);
      ctx.lineTo(20*s, 20*s);
      ctx.stroke();
      break;
    case 'unavailable':
      ctx.beginPath();
      ctx.arc(16*s, 16*s, 8*s, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(6*s, 26*s);
      ctx.lineTo(26*s, 6*s);
      ctx.stroke();
      break;
    case 'vresize':
      ctx.beginPath();
      ctx.moveTo(16*s, 4*s);
      ctx.lineTo(10*s, 10*s);
      ctx.lineTo(14*s, 10*s);
      ctx.lineTo(14*s, 22*s);
      ctx.lineTo(10*s, 22*s);
      ctx.lineTo(16*s, 28*s);
      ctx.lineTo(22*s, 22*s);
      ctx.lineTo(18*s, 22*s);
      ctx.lineTo(18*s, 10*s);
      ctx.lineTo(22*s, 10*s);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case 'hresize':
      ctx.beginPath();
      ctx.moveTo(4*s, 16*s);
      ctx.lineTo(10*s, 10*s);
      ctx.lineTo(10*s, 14*s);
      ctx.lineTo(22*s, 14*s);
      ctx.lineTo(22*s, 10*s);
      ctx.lineTo(28*s, 16*s);
      ctx.lineTo(22*s, 22*s);
      ctx.lineTo(22*s, 18*s);
      ctx.lineTo(10*s, 18*s);
      ctx.lineTo(10*s, 22*s);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case 'dresize1':
      ctx.beginPath();
      ctx.moveTo(4*s, 4*s);
      ctx.lineTo(10*s, 4*s);
      ctx.lineTo(10*s, 8*s);
      ctx.lineTo(24*s, 22*s);
      ctx.lineTo(28*s, 22*s);
      ctx.lineTo(28*s, 28*s);
      ctx.lineTo(22*s, 28*s);
      ctx.lineTo(22*s, 24*s);
      ctx.lineTo(8*s, 10*s);
      ctx.lineTo(4*s, 10*s);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case 'dresize2':
      ctx.beginPath();
      ctx.moveTo(28*s, 4*s);
      ctx.lineTo(22*s, 4*s);
      ctx.lineTo(22*s, 8*s);
      ctx.lineTo(8*s, 22*s);
      ctx.lineTo(4*s, 22*s);
      ctx.lineTo(4*s, 28*s);
      ctx.lineTo(10*s, 28*s);
      ctx.lineTo(10*s, 24*s);
      ctx.lineTo(24*s, 10*s);
      ctx.lineTo(28*s, 10*s);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case 'move':
      ctx.beginPath();
      ctx.moveTo(16*s, 2*s);
      ctx.lineTo(10*s, 8*s);
      ctx.lineTo(14*s, 8*s);
      ctx.lineTo(14*s, 24*s);
      ctx.lineTo(10*s, 24*s);
      ctx.lineTo(16*s, 30*s);
      ctx.lineTo(22*s, 24*s);
      ctx.lineTo(18*s, 24*s);
      ctx.lineTo(18*s, 8*s);
      ctx.lineTo(22*s, 8*s);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case 'link':
      ctx.beginPath();
      ctx.moveTo(10*s, 4*s);
      ctx.lineTo(6*s, 4*s);
      ctx.lineTo(6*s, 20*s);
      ctx.lineTo(16*s, 20*s);
      ctx.lineTo(16*s, 16*s);
      ctx.lineTo(12*s, 16*s);
      ctx.lineTo(12*s, 22*s);
      ctx.lineTo(8*s, 22*s);
      ctx.lineTo(8*s, 6*s);
      ctx.lineTo(12*s, 6*s);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(14*s, 4*s);
      ctx.lineTo(18*s, 4*s);
      ctx.lineTo(18*s, 12*s);
      ctx.lineTo(14*s, 12*s);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
  }
  ctx.restore();
  saveCurrentImageData();
}

function initCanvas() {
  drawDefaultCursorBackground();
  isDrawn = false;
  continueBtn.disabled = true;
}

function loadType(index) {
  if (index >= cursorTypes.length) {
    stepButtons.classList.add('hidden');
    downloadBtn.classList.remove('hidden');
    currentTypeSpan.textContent = 'Done!';
    return;
  }
  const type = cursorTypes[index];
  currentTypeSpan.textContent = type.name;
  initCanvas();
  stepButtons.classList.remove('hidden');
  downloadBtn.classList.add('hidden');
  backBtn.classList.remove('hidden');
}

function nextType() {
  currentTypeIndex++;
  loadType(currentTypeIndex);
}

function saveCurrent() {
  const currentType = cursorTypes[currentTypeIndex];
  drawings[currentType.id] = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function getPixelCoords(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = Math.floor((e.clientX - rect.left) * scaleX);
  const y = Math.floor((e.clientY - rect.top) * scaleY);
  return { x, y };
}

function floodFill(x, y, fillColor) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const targetColor = ctx.getImageData(x, y, 1, 1).data;
  if (targetColor[0] === fillColor[0] && targetColor[1] === fillColor[1] && targetColor[2] === fillColor[2] && targetColor[3] === fillColor[3]) return;
  const visited = new Uint8Array(canvas.width * canvas.height);
  const stack = [[x, y]];
  while (stack.length) {
    const [cx, cy] = stack.pop();
    const idx = cy * canvas.width + cx;
    if (visited[idx]) continue;
    visited[idx] = 1;
    const pixelIdx = idx * 4;
    if (data[pixelIdx] === targetColor[0] && data[pixelIdx+1] === targetColor[1] && data[pixelIdx+2] === targetColor[2] && data[pixelIdx+3] === targetColor[3]) {
      data[pixelIdx] = fillColor[0];
      data[pixelIdx+1] = fillColor[1];
      data[pixelIdx+2] = fillColor[2];
      data[pixelIdx+3] = 255;
      if (cx > 0) stack.push([cx-1, cy]);
      if (cx < canvas.width-1) stack.push([cx+1, cy]);
      if (cy > 0) stack.push([cx, cy-1]);
      if (cy < canvas.height-1) stack.push([cx, cy+1]);
    }
  }
  ctx.putImageData(imageData, 0, 0);
  isDrawn = true;
  continueBtn.disabled = false;
  saveCurrentImageData();
}

function drawBrush(x, y) {
  const half = Math.floor(currentBrushSize / 2);
  if (currentTool === 'pencil') {
    ctx.fillStyle = colorPicker.value;
  } else if (currentTool === 'eraser') {
    ctx.fillStyle = '#ffffff';
  }
  ctx.fillRect(x - half, y - half, currentBrushSize, currentBrushSize);
  isDrawn = true;
  continueBtn.disabled = false;
  saveCurrentImageData();
}

canvas.addEventListener('mousedown', (e) => {
  if (currentTool === 'zoomin') {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    offsetX = offsetX - (mouseX - rect.width / 2) * zoomLevel;
    offsetY = offsetY - (mouseY - rect.height / 2) * zoomLevel;
    zoomLevel *= 2;
    updateCanvasDisplay();
    restoreImageData();
    return;
  }
  if (currentTool === 'pencil' || currentTool === 'eraser') {
    const { x, y } = getPixelCoords(e);
    drawBrush(x, y);
  } else if (currentTool === 'fill') {
    const { x, y } = getPixelCoords(e);
    const fillColor = hexToRgb(colorPicker.value);
    floodFill(x, y, fillColor);
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (e.buttons === 1 && (currentTool === 'pencil' || currentTool === 'eraser')) {
    const { x, y } = getPixelCoords(e);
    drawBrush(x, y);
  }
});

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return [r, g, b];
}

clearBtn.addEventListener('click', () => {
  initCanvas();
});

backBtn.addEventListener('click', () => {
  if (isDrawn) {
    saveCurrent();
  }
  if (currentTypeIndex === 0) {
    editor.classList.add('hidden');
    startScreen.classList.remove('hidden');
    drawings = {};
    currentTypeIndex = 0;
  } else {
    currentTypeIndex--;
    loadType(currentTypeIndex);
  }
});

skipBtn.addEventListener('click', nextType);

continueBtn.addEventListener('click', () => {
  saveCurrent();
  nextType();
});

function setActiveTool(tool) {
  currentTool = tool;
  pencilTool.classList.remove('active');
  eraserTool.classList.remove('active');
  fillTool.classList.remove('active');
  zoomInBtn.classList.remove('active');
  if (tool === 'pencil') pencilTool.classList.add('active');
  if (tool === 'eraser') eraserTool.classList.add('active');
  if (tool === 'fill') fillTool.classList.add('active');
  if (tool === 'zoomin') zoomInBtn.classList.add('active');
}

pencilTool.addEventListener('click', () => setActiveTool('pencil'));
eraserTool.addEventListener('click', () => setActiveTool('eraser'));
fillTool.addEventListener('click', () => setActiveTool('fill'));

zoomInBtn.addEventListener('click', () => {
  if (currentTool === 'zoomin') {
    setActiveTool('pencil');
  } else {
    setActiveTool('zoomin');
  }
});

zoomOutBtn.addEventListener('click', () => {
  if (zoomLevel > 0.1) {
    zoomLevel = Math.max(zoomLevel / 2, 0.1);
    offsetX = offsetX / 2;
    offsetY = offsetY / 2;
    updateCanvasDisplay();
    restoreImageData();
  }
});

brushSize.addEventListener('input', () => {
  currentBrushSize = parseInt(brushSize.value);
  brushSizeLabel.textContent = currentBrushSize;
});

function canvasToCur(imageData, width, height) {
  const w = width;
  const h = height;
  const buffer = new ArrayBuffer(6 + 16 + 40 + w*h*4 + w*h/8);
  const dv = new DataView(buffer);
  dv.setUint16(0, 0, true);
  dv.setUint16(2, 2, true);
  dv.setUint16(4, 1, true);
  dv.setUint8(6, w);
  dv.setUint8(7, h);
  dv.setUint8(8, 0);
  dv.setUint8(9, 0);
  dv.setUint16(10, 0, true);
  dv.setUint16(12, 0, true);
  const dataSize = 40 + w*h*4 + w*h/8;
  dv.setUint32(14, dataSize, true);
  dv.setUint32(18, 22, true);
  const biOffset = 22;
  dv.setUint32(biOffset, 40, true);
  dv.setInt32(biOffset+4, w, true);
  dv.setInt32(biOffset+8, h*2, true);
  dv.setUint16(biOffset+12, 1, true);
  dv.setUint16(biOffset+14, 32, true);
  dv.setUint32(biOffset+16, 0, true);
  dv.setUint32(biOffset+20, w*h*4 + w*h/8, true);
  dv.setInt32(biOffset+24, 0, true);
  dv.setInt32(biOffset+28, 0, true);
  dv.setUint32(biOffset+32, 0, true);
  dv.setUint32(biOffset+36, 0, true);
  const pixels = imageData.data;
  const pixelOffset = biOffset + 40;
  for (let y = 0; y < h; y++) {
    const srcY = h - 1 - y;
    for (let x = 0; x < w; x++) {
      const srcIndex = (srcY * w + x) * 4;
      const dstIndex = pixelOffset + (y * w + x) * 4;
      dv.setUint8(dstIndex, pixels[srcIndex + 2]);
      dv.setUint8(dstIndex + 1, pixels[srcIndex + 1]);
      dv.setUint8(dstIndex + 2, pixels[srcIndex]);
      dv.setUint8(dstIndex + 3, pixels[srcIndex + 3]);
    }
  }
  const andOffset = pixelOffset + w*h*4;
  for (let i = 0; i < w*h/8; i++) {
    dv.setUint8(andOffset + i, 0);
  }
  return buffer;
}

function generateInstallInf(selectedTypes) {
  let inf = `[Version]\nSignature = "$Chicago$"\n\n[DefaultInstall]\nCopyFiles = Scheme.Cur\nAddReg = Scheme.AddReg\n\n[DestinationDirs]\nScheme.Cur = 10,"Cursors\\LucCursor"\n\n[Scheme.Cur]\n`;
  selectedTypes.forEach(type => {
    inf += `${type.file}\n`;
  });
  inf += `\n[Scheme.AddReg]\nHKCU,"Control Panel\\Cursors","",0x00020000,`;
  const paths = selectedTypes.map(t => `%10%\\Cursors\\LucCursor\\${t.file}`).join(',');
  inf += `"${paths}"\n`;
  return inf;
}

function generateInstallBat() {
  let bat = `@echo off\n`;
  bat += `rundll32 syssetup,SetupInfObjectInstallAction DefaultInstall 128 .\\install.inf\n`;
  bat += `reg add "HKCU\\Control Panel\\Cursors" /v "" /d "LucCursor" /f\n`;
  bat += `RUNDLL32.EXE user32.dll,UpdatePerUserSystemParameters\n`;
  bat += `echo Cursors installed!\n`;
  bat += `pause\n`;
  return bat;
}

downloadBtn.addEventListener('click', async () => {
  const selectedTypes = cursorTypes.filter(type => drawings[type.id]);
  if (selectedTypes.length === 0) {
    alert('No cursors selected');
    return;
  }
  const zip = new JSZip();
  const cursorsFolder = zip.folder('cursors');
  for (const type of selectedTypes) {
    const curBuffer = canvasToCur(drawings[type.id], cursorSize, cursorSize);
    cursorsFolder.file(type.file, curBuffer);
  }
  const installInf = generateInstallInf(selectedTypes);
  zip.file('install.inf', installInf);
  zip.file('install.bat', generateInstallBat());
  try {
    const response = await fetch('README.md');
    if (response.ok) {
      const readmeText = await response.text();
      zip.file('README.md', readmeText);
    }
  } catch (e) {}
  const blob = await zip.generateAsync({type: 'blob'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'LucCursor.zip';
  a.click();
  URL.revokeObjectURL(url);
});

donateBtn.addEventListener('click', () => {
  donateMenu.classList.toggle('show');
});

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  document.body.classList.toggle('light');
  const icon = themeToggle.querySelector('.icon');
  if (document.body.classList.contains('dark')) {
    icon.textContent = '☀️';
  } else {
    icon.textContent = '🌙';
  }
});

copyBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    navigator.clipboard.writeText(btn.dataset.address).then(() => {
      const original = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = original, 1500);
    });
  });
});

startBtn.addEventListener('click', () => {
  cursorSize = parseInt(sizeSelect.value);
  zoomLevel = 1;
  offsetX = 0;
  offsetY = 0;
  setCanvasSize(cursorSize);
  startScreen.classList.add('hidden');
  editor.classList.remove('hidden');
  currentTypeIndex = 0;
  loadType(0);
});

logo.addEventListener('click', () => {
  window.open('https://github.com/lucovisa', '_blank');
});