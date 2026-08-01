# Cell//Drive

A cyberpunk WebGL portfolio where visitors drive a DNA Rover around a five-stop project route. The presentation combines mature CC0 Quaternius environment modules with authored bioinformatics landmarks, wet lighting, Rapier vehicle physics, and an intentionally stable camera.

The original print-ready CV remains at [resume.html](resume.html).

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

The check command validates asset provenance, runs Vitest, and creates the production Vite build. Browser smoke tests are separate:

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

- \`src/camera.js\`: stable world-space camera and pan/zoom controls
- \`src/assets.js\`: Quaternius glTF loading and unmodified scene cloning
- \`src/world.js\`: five-stop route, mature asset placement, atmosphere, props, and collectibles
- \`src/vehicle.js\`: Rapier ray-cast rover and driving input
- \`src/rendering.js\`: adaptive, restrained postprocessing
- \`assets/manifest.json\`: required license and provenance ledger
- \`THIRD_PARTY_ASSETS.md\`: human-readable source and reuse policy

The Pages workflow deploys only from \`main\`. This implementation branch runs CI and is not deployed.
