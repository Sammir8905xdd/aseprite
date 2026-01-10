const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const widthInput = document.getElementById('width');
const heightInput = document.getElementById('height');
const colorInput = document.getElementById('color');
const clearBtn = document.getElementById('clear');
const exportBtn = document.getElementById('export-ase');
const zipBtn = document.getElementById('download-zip');

function resizeCanvas(w,h){
  canvas.width = w; canvas.height = h;
  canvas.style.width = (w*4)+'px'; canvas.style.height = (h*4)+'px';
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,w,h);
}

widthInput.addEventListener('change', ()=> resizeCanvas(+widthInput.value, +heightInput.value));
heightInput.addEventListener('change', ()=> resizeCanvas(+widthInput.value, +heightInput.value));
clearBtn.addEventListener('click', ()=>{ ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,canvas.width,canvas.height); });

let drawing=false;
function posFromEvent(e){
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = Math.floor((e.clientX - rect.left) * scaleX);
  const y = Math.floor((e.clientY - rect.top) * scaleY);
  return {x,y};
}

canvas.addEventListener('mousedown', (e)=>{ drawing=true; const p=posFromEvent(e); drawPixel(p.x,p.y); });
canvas.addEventListener('mousemove', (e)=>{ if(drawing){ const p=posFromEvent(e); drawPixel(p.x,p.y); }});
window.addEventListener('mouseup', ()=>drawing=false);

function drawPixel(x,y){ ctx.fillStyle = colorInput.value; ctx.fillRect(x,y,1,1); }

exportBtn.addEventListener('click', ()=>{
  const w = canvas.width, h = canvas.height;
  const img = ctx.getImageData(0,0,w,h).data; // RGBA
  const blob = aseExporter.buildAse(w,h,new Uint8Array(img.buffer));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'sprite.ase';
  a.click();
});

zipBtn.addEventListener('click', async ()=>{
  const zip = new JSZip();
  // include files from this web_trial folder
  const files = ['index.html','style.css','app.js','ase_exporter.js'];
  for(const f of files){
    const resp = await fetch(f);
    const txt = await resp.text();
    zip.file(f, txt);
  }
  // add a placeholder WASM
  zip.file('plugin.wasm', new Uint8Array([0x00]));
  const content = await zip.generateAsync({type:'blob'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(content);
  a.download = 'aseprite-web-trial.zip';
  a.click();
});

// init
resizeCanvas(+widthInput.value, +heightInput.value);
