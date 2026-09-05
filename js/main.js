const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d');
const cursorList = document.getElementById('cursorList');
const currentTypeSpan = document.getElementById('currentType');
const colorPicker = document.getElementById('colorPicker');
const clearBtn = document.getElementById('clearBtn');
const downloadBtn = document.getElementById('downloadBtn');

let drawings = {};
let activeType = 'normal';

function initCanvas() {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function renderCursorList() {
  cursorTypes.forEach(type => {
    const li = document.createElement('li');
    li.textContent = type.name;
    li.dataset.id = type.id;
    li.addEventListener('click', () => selectType(type.id));
    cursorList.appendChild(li);
  });
  selectType('normal');
}

function selectType(id) {
  activeType = id;
  document.querySelectorAll('#cursorList li').forEach(li => {
    li.classList.toggle('active', li.dataset.id === id);
  });
  currentTypeSpan.textContent = cursorTypes.find(t => t.id === id).name;
  loadDrawing(id);
}

function loadDrawing(id) {
  if (drawings[id]) {
    ctx.putImageData(drawings[id], 0, 0);
  } else {
    initCanvas();
  }
}

function saveDrawing() {
  drawings[activeType] = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = Math.floor((e.clientX - rect.left) * scaleX);
  const y = Math.floor((e.clientY - rect.top) * scaleY);
  ctx.fillStyle = colorPicker.value;
  ctx.fillRect(x, y, 1, 1);
  saveDrawing();
});

canvas.addEventListener('mousemove', (e) => {
  if (e.buttons === 1) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);
    ctx.fillStyle = colorPicker.value;
    ctx.fillRect(x, y, 1, 1);
    saveDrawing();
  }
});

clearBtn.addEventListener('click', () => {
  initCanvas();
  saveDrawing();
});

function canvasToCur(imageData) {
  const w = 32, h = 32;
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

function generateInstallInf() {
  let inf = `[Version]\nSignature = "$Chicago$"\n\n[DefaultInstall]\nCopyFiles = Scheme.Cur\nAddReg = Scheme.AddReg\n\n[DestinationDirs]\nScheme.Cur = 10,"Cursors\\LucCursor"\n\n[Scheme.Cur]\n`;
  cursorTypes.forEach(type => {
    inf += `${type.file}\n`;
  });
  inf += `\n[Scheme.AddReg]\nHKCU,"Control Panel\\Cursors\\Schemes","LucCursor",0x00020000,`;
  const paths = cursorTypes.map(t => `%10%\\Cursors\\LucCursor\\${t.file}`).join(',');
  inf += `"${paths}"\n`;
  return inf;
}

downloadBtn.addEventListener('click', async () => {
  const zip = new JSZip();
  const cursorsFolder = zip.folder('cursors');
  
  for (const type of cursorTypes) {
    let imageData = drawings[type.id];
    if (!imageData) {
      imageData = ctx.createImageData(32, 32);
    }
    const curBuffer = canvasToCur(imageData);
    cursorsFolder.file(type.file, curBuffer);
  }
  
  const installInf = generateInstallInf();
  zip.file('install.inf', installInf);

  try {
    const response = await fetch('README.md');
    if (response.ok) {
      const readmeText = await response.text();
      zip.file('README.md', readmeText);
    }
  } catch (e) {
    console.log('README not found');
  }
  
  const blob = await zip.generateAsync({type: 'blob'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'LucCursor.zip';
  a.click();
  URL.revokeObjectURL(url);
});

initCanvas();
renderCursorList();