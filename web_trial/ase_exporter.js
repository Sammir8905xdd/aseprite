// Minimal .ase exporter (single-frame, single-layer, RGBA) using pako
(function(global){
  function writeUInt32LE(arr, value){
    arr.push(value & 0xFF, (value>>8)&0xFF, (value>>16)&0xFF, (value>>24)&0xFF);
  }
  function writeUInt16LE(arr, value){
    arr.push(value & 0xFF, (value>>8)&0xFF);
  }
  function writeInt16LE(arr, value){ writeUInt16LE(arr, value & 0xFFFF); }
  function writeUInt8(arr, value){ arr.push(value & 0xFF); }
  function writeBytes(arr, bytes){ for(var i=0;i<bytes.length;i++) arr.push(bytes[i]); }
  function writeString(arr, str){
    var encoder = new TextEncoder();
    var b = encoder.encode(str);
    writeUInt16LE(arr, b.length);
    writeBytes(arr, b);
  }

  function concatArrays(chunks){
    var total=0; for(var i=0;i<chunks.length;i++) total+=chunks[i].length;
    var out=new Uint8Array(total); var ptr=0; for(var i=0;i<chunks.length;i++){ out.set(chunks[i], ptr); ptr+=chunks[i].length; }
    return out;
  }

  // Build a minimal ASE file (v1 compatible) for given width,height and rgba Uint8Array pixels
  function buildAse(width, height, pixelsRGBA){
    var parts=[]; // arrays of bytes
    var header=[];
    // placeholder file size
    writeUInt32LE(header, 0);
    writeUInt16LE(header, 0xA5E0);
    writeUInt16LE(header, 1); // frames
    writeUInt16LE(header, width);
    writeUInt16LE(header, height);
    writeUInt16LE(header, 32); // color depth 32
    writeUInt32LE(header, 0); // flags
    writeUInt16LE(header, 0); // speed
    writeUInt32LE(header, 0);
    writeUInt32LE(header, 0);
    writeUInt8(header, 0);
    writeUInt8(header, 0); writeUInt8(header,0); writeUInt8(header,0);
    writeUInt16LE(header, 0);
    writeUInt8(header,0); writeUInt8(header,0);
    writeInt16LE(header,0); writeInt16LE(header,0);
    writeUInt16LE(header,0); writeUInt16LE(header,0);
    for(var i=0;i<84;i++) writeUInt8(header,0);

    parts.push(new Uint8Array(header));

    // Frame (we'll add chunks then fill frame size later)
    var frameParts=[];
    // placeholder frame size
    var frameHeader=[]; writeUInt32LE(frameHeader,0);
    writeUInt16LE(frameHeader,0xF1FA);
    writeUInt16LE(frameHeader,1); // old chunks
    writeUInt16LE(frameHeader,100); // duration 100ms
    writeUInt8(frameHeader,0); writeUInt8(frameHeader,0);
    writeUInt32LE(frameHeader,0);
    frameParts.push(new Uint8Array(frameHeader));

    // Layer chunk (0x2004)
    var layerData=[];
    writeUInt16LE(layerData,1); // flags visible
    writeUInt16LE(layerData,0); // type normal
    writeUInt16LE(layerData,0); // child level
    writeUInt16LE(layerData,0); // default w
    writeUInt16LE(layerData,0); // default h
    writeUInt16LE(layerData,0); // blend mode
    writeUInt8(layerData,255); // opacity
    writeUInt8(layerData,0); writeUInt8(layerData,0); writeUInt8(layerData,0);
    writeString(layerData, "Layer 1");
    var layerChunk=[]; writeUInt32LE(layerChunk, 6 + layerData.length);
    writeUInt16LE(layerChunk, 0x2004);
    writeBytes(layerChunk, layerData);
    frameParts.push(new Uint8Array(layerChunk));

    // Cel chunk (0x2005) compressed image (type 2)
    var celData=[];
    writeUInt16LE(celData, 0); // layer index
    writeInt16LE(celData, 0); // x
    writeInt16LE(celData, 0); // y
    writeUInt8(celData, 255); // opacity
    writeUInt16LE(celData, 2); // cel type = compressed image
    writeInt16LE(celData, 0); // z-index
    for(var i=0;i<5;i++) writeUInt8(celData,0);
    writeUInt16LE(celData, width);
    writeUInt16LE(celData, height);

    // raw pixel data row by row
    var raw = new Uint8Array(width*height*4);
    raw.set(pixelsRGBA);
    var compressed = pako.deflate(raw);
    // append compressed bytes
    for(var i=0;i<compressed.length;i++) writeUInt8(celData, compressed[i]);

    var celChunk=[]; writeUInt32LE(celChunk, 6 + celData.length);
    writeUInt16LE(celChunk, 0x2005);
    writeBytes(celChunk, celData);
    frameParts.push(new Uint8Array(celChunk));

    // finalize frame: compute frame size
    var frameConcat = concatArrays(frameParts);
    var frameSize = frameConcat.length;
    // write frame size at offset 0
    var frameSizeBytes = new Uint8Array(4);
    frameSizeBytes[0] = frameSize & 0xFF; frameSizeBytes[1] = (frameSize>>8)&0xFF; frameSizeBytes[2] = (frameSize>>16)&0xFF; frameSizeBytes[3] = (frameSize>>24)&0xFF;
    frameConcat.set(frameSizeBytes, 0);

    parts.push(frameConcat);

    // compute file size
    var fileConcat = concatArrays(parts);
    var fileSize = fileConcat.length;
    var fileSizeBytes = new Uint8Array(4);
    fileSizeBytes[0] = fileSize & 0xFF; fileSizeBytes[1] = (fileSize>>8)&0xFF; fileSizeBytes[2] = (fileSize>>16)&0xFF; fileSizeBytes[3] = (fileSize>>24)&0xFF;
    fileConcat.set(fileSizeBytes, 0);

    return new Blob([fileConcat], {type:'application/octet-stream'});
  }

  global.aseExporter = { buildAse };
})(this);
