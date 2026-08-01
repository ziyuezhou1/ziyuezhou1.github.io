# Genome City

An immersive cyberpunk portfolio for bioinformatics and AI engineering. Visitors drive a lightweight DNA Rover through a procedural Three.js city and inspect project nodes for single-cell analysis, bulk RNA-seq, medical AI, and agent UX.

The original print-ready resume is preserved at [resume.html](resume.html).

## Features

- Procedural Three.js world with no downloaded 3D models
- Arcade keyboard and touch driving controls
- Chinese and English interface with saved preferences
- Automatic low, medium, and high quality modes
- Accessible project directory when WebGL or motion is unavailable
- Multi-page Vite build for the 3D portfolio and A4 resume
- GitHub Pages build workflow, unit tests, and browser smoke tests

## Development

Requires Node.js 20.19 or newer.

    npm install
    npm run dev
    npm test
    npm run build
    npm run preview

Run browser smoke tests after installing Chromium:

    npx playwright install chromium
    npm run test:e2e

## Controls

- W, A, S, D or arrow keys: drive and steer
- Shift: boost
- Space or left Control: brake
- Drag: orbit the chase camera
- E or Enter: open a nearby project node
- R: return the rover to the city entrance
- Escape: close the project panel

Mobile devices receive touch steering, boost, and brake controls with low-quality rendering by default.

## Structure

- src/main.js coordinates rendering, UI, localization, and project proximity.
- src/world.js builds the procedural city and landmark effects.
- src/vehicle.js owns arcade driving, collisions, camera follow, and touch input.
- src/content.js is the bilingual source of truth for profile and project copy.
- resume.html is the preserved A4 print view.

## Deployment

The Pages workflow builds both entry pages into dist when main is updated. Development branches run CI only and do not deploy. Review the immersive branch before merging it into main.
