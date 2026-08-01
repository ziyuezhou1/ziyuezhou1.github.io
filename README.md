# ZY / Mini City

A bright, driveable miniature-city portfolio built with Three.js and Rapier. Visitors explore five project districts, collect eight city stamps, choose one of four cars, or run an optional one-lap time trial. The fixed 25° high three-quarter camera keeps the world readable and avoids motion-heavy camera rotation.

The print-ready CV remains at [resume.html](resume.html), and the four earlier art-direction studies remain under [style-lab/index.html](style-lab/index.html).

## Experience

- Mature Kenney City Builder and Starter Kit Racing CC0 models
- One continuous city loop with six ordered race checkpoints
- Four saved vehicle choices and per-vehicle local best times
- Five physical project markers and an accessible non-WebGL directory
- Progressive north/east/south/west district loading
- Two ramps, movable barriers, boost, drift, jump, and collectibles
- Bright daylight rendering without bloom, chromatic aberration, rain, or camera rotation

## Development

Node.js 20.19 or newer is required.

    npm install
    npm run dev
    npm run check
    npm run preview

Open `http://localhost:5173/` for the city and `http://localhost:5173/style-lab/` for the style comparison. Browser smoke tests are separate:

    npx playwright install chromium
    npm run test:e2e

## Controls

- W, A, S, D or arrow keys: drive
- Shift: boost; Space: drift/brake; Q: jump; R: reset
- E or Enter: open a nearby project or start at the orange race gate
- Escape: close a project or leave the race
- Drag: pan; wheel or pinch: zoom within the fixed camera preset

## Architecture

- `src/assets.js`: deduplicated core and approach-zone model loading
- `src/world.js`: city layout, districts, track, props, ramps, and stamps
- `src/vehicle.js`: shared Rapier handling with replaceable car visuals
- `src/race.js`: deterministic countdown, ordered checkpoints, and local bests
- `assets/manifest.json`: validated license and provenance ledger

Pages deploys only from `main`; this implementation branch is not deployed.
