Aseprite — Web Trial

Este directorio incluye una versión web mínima en "trial mode":
- Editor de píxeles básico en `canvas`.
- Exportador `.ase` (single-frame, single-layer, RGBA) en `ase_exporter.js`.
- Script `build.sh` que empaqueta los archivos en `aseprite-web-trial.zip`.

Notas:
- Este es un prototipo mínimo. Compilar todo Aseprite a WASM no está incluido aquí.
- `plugin.wasm` es un marcador de posición; para incluir módulos WASM compilados, sustituye ese archivo.

Para crear el ZIP localmente:

```bash
cd web_trial
./build.sh
```
