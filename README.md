# Cell//Drive

An interactive, rain-soaked bioinformatics portfolio built as a focused WebGL driving experience. Visitors pilot the DNA Rover from a project transit terminal into a single-cell laboratory, collect data fragments, hit a jump ramp, move physical props, and inspect bilingual project records in a diegetic terminal.

The original print-ready CV remains available at [resume.html](resume.html).

## Experience

- Rapier dynamic chassis with four ray-cast suspension wheels, braking, boost, jump, collisions, and reset
- Spring chase camera with obstacle avoidance, impact shake, and speed-sensitive field of view
- Authored bio-industrial route with wet surfaces, rain, laboratory pods, pipes, light beams, a ramp, and movable crates
- Three quality tiers; postprocessed bloom, vignette, and restrained chromatic aberration on capable devices
- Procedural Howler soundscape, muted by default
- Minimal driving HUD plus a terminal that keeps all five projects accessible
- Static accessible directory when WebGL is unavailable or reduced motion is preferred

## Development

Node.js 20.19 or newer is required.

    npm install
    npm run dev
    npm run check
    npm run preview

The check command validates asset provenance, runs Vitest, and creates the production Vite build. Browser smoke tests are available separately:

    npx playwright install chromium
    npm run test:e2e

## Controls

- W, A, S, D or arrow keys: drive and steer
- Shift: boost
- Space: brake and loosen rear grip for a controlled drift
- Q: jump when the suspension is grounded
- Drag: rotate the chase camera
- E or Enter: connect to a nearby terminal
- R: reset at the entrance
- Escape: close the project terminal

Touch controls appear on smaller screens. Mobile defaults to low quality and desktop hardware is assigned medium or high quality automatically.

## Architecture

- src/physics.js: fixed-step Rapier world and scene-query helpers
- src/vehicle.js: ray-cast vehicle, input, wheel visuals, and spring camera
- src/world.js: authored laboratory world, animation, collectibles, and physics props
- src/rendering.js: renderer and adaptive postprocessing pipeline
- src/audio.js: runtime-generated Howler soundscape
- src/content.js: bilingual portfolio content and physical terminal placement
- assets/manifest.json: mandatory asset license and provenance ledger

The Pages workflow deploys only from main. This development branch runs CI and does not deploy.
