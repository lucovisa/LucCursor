const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d');
const currentTypeSpan = document.getElementById('currentType');
const colorPicker = document.getElementById('colorPicker');
const clearBtn = document.getElementById('clearBtn');
const skipBtn = document.getElementById('skipBtn');
const continueBtn = document.getElementById('continueBtn');
const downloadBtn = document.getElementById('downloadBtn');
const stepButtons = document.getElementById('stepButtons');
const donateBtn = document.getElementById('donateBtn');
const donateMenu = document.getElementById('donateMenu');
const themeToggle = document.getElementById('themeToggle');
const copyBtns = document.querySelectorAll('.copy-btn');

let drawings = {};
let currentTypeIndex = 0;
let isDrawn = false;

function initCanvas() {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
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
  isDrawn = false;
  continueBtn.disabled = true;
  stepButtons.classList.remove('hidden');
  downloadBtn.classList.add('hidden');
}

function nextType() {
  currentTypeIndex++;
  loadType(currentTypeIndex);
}

function saveCurrent() {
  const currentType = cursorTypes[currentTypeIndex];
  drawings[currentType.id] = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = Math.floor((e.clientX - rect.left) * scaleX);
  const y = Math.floor((e.clientY - rect.top) * scaleY);
  ctx.fillStyle = colorPicker.value;
  ctx.fillRect(x, y, 1, 1);
  isDrawn = true;
  continueBtn.disabled = false;
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
    isDrawn = true;
    continueBtn.disabled = false;
  }
});

clearBtn.addEventListener('click', () => {
  initCanvas();
  isDrawn = false;
  continueBtn.disabled = true;
});

skipBtn.addEventListener('click', nextType);

continueBtn.addEventListener('click', () => {
  saveCurrent();
  nextType();
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
    const curBuffer = canvasToCur(drawings[type.id]);
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

donateBtn.addEventListener('click', () => {
  donateMenu.classList.toggle('show');
  donateMenu.classList.toggle('hidden');
});

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  document.body.classList.toggle('light');
  const icon = themeToggle.querySelector('.icon');
  const text = themeToggle.querySelector('.text');
  if (document.body.classList.contains('dark')) {
    icon.textContent = '🌙';
    text.textContent = 'Dark';
  } else {
    icon.textContent = '☀️';
    text.textContent = 'Light';
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

loadType(0);