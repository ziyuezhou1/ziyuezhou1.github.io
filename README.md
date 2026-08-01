# Cell//Drive

A cyberpunk WebGL portfolio where visitors drive a DNA Rover around a five-stop project route. The presentation combines mature CC0 Quaternius environment modules with authored bioinformatics landmarks, wet lighting, Rapier vehicle physics, and an intentionally stable camera.

The original print-ready CV remains at [resume.html](resume.html).

## 3D Style Lab

Four non-driving art-direction studies are available at [style-lab/index.html](style-lab/index.html):

- Toy-block modern city using Kenney City Builder assets
- Storybook medieval settlement using KayKit Medieval Hexagon assets
- Frontier lunar base using KayKit Space Base Bits
- Low-poly wilderness using the KayKit nature set

Every study uses the same fixed 25° high three-quarter camera. Drag pans the focus and wheel or pinch zooms; the direction never rotates. Models, materials, and textures are preserved from their CC0 source packs.

## Experience

- Fixed 25° FOV, high three-quarter camera inspired by Bruno Simon's comfortable world-view design
- Camera direction stays independent of rover heading; drag pans and wheel/pinch zooms
- Five physical project terminals on one readable loop
- Original Quaternius Cyberpunk Game Kit glTF modules, with their meshes and materials preserved
- Rain, wet surfaces, restrained bloom, physical props, collectibles, boost, drift, and jump
- Reduced-motion mode keeps the fixed 3D world and automatically selects low quality
- Accessible project directory when WebGL is unavailable

## Development

Node.js 20.19 or newer is required.

    npm install
    npm run dev
    npm run check
    npm run preview

Open <code>http://localhost:5173/style-lab/</code> after starting Vite. The check command validates asset provenance, runs Vitest, and creates the production build. Browser smoke tests are separate:

    npx playwright install chromium
    npm run test:e2e

## Controls

- W, A, S, D or arrow keys: drive and steer
- Shift: boost
- Space: drift/brake
- Q: jump
- Drag: pan the fixed camera focus
- Wheel or pinch: zoom between the comfort limits
- E or Enter: open a nearby project terminal
- R: reset the rover
- Escape: close the project terminal

## Architecture

- <code>src/camera.js</code>: stable world-space homepage camera
- <code>src/assets.js</code>: Quaternius glTF loading and unmodified scene cloning
- <code>src/world.js</code>: five-stop route, atmosphere, props, and collectibles
- <code>src/style-lab/config.js</code>: four pack manifests and authored placement layouts
- <code>src/style-lab/main.js</code>: shared fixed-camera model showcase renderer
- <code>src/vehicle.js</code>: Rapier ray-cast rover and driving input
- <code>src/rendering.js</code>: adaptive, restrained postprocessing
- <code>assets/manifest.json</code>: required license and provenance ledger
- <code>THIRD_PARTY_ASSETS.md</code>: human-readable source and reuse policy

The Pages workflow deploys only from <code>main</code>. This implementation branch runs CI and is not deployed.
