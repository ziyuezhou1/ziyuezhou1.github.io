export const STYLE_ORDER = ['city', 'medieval', 'space', 'nature'];

export const STYLE_DEMOS = {
  city: {
    index: '01',
    slug: 'city',
    title: 'Toy-block Modern City',
    shortTitle: 'Modern City',
    kicker: 'KENNEY / CITY BUILDER',
    description:
      'A clean, optimistic miniature city assembled from finished Kenney buildings, roads, trees, and civic props.',
    sourceLabel: 'Kenney Starter Kit: City Builder',
    sourceUrl: 'https://github.com/KenneyNL/Starter-Kit-City-Builder',
    license: 'CC0 1.0',
    accent: '#f06c48',
    background: '#cadbd2',
    fog: '#cadbd2',
    fogDensity: 0.018,
    ground: '#8eaf91',
    groundEdge: '#dae5cb',
    exposure: 1.06,
    camera: { fov: 25, radius: 27, minRadius: 18, maxRadius: 39, focusY: 2.1, panLimit: 8 },
    assets: [
      {
        path: '/assets/style-lab/city/road-intersection.glb',
        size: 12,
        placements: [{ position: [0, 0, 0], rotation: 0 }],
      },
      {
        path: '/assets/style-lab/city/road-straight-lightposts.glb',
        size: 10,
        placements: [{ position: [0, 0.02, 8], rotation: 0 }],
      },
      {
        path: '/assets/style-lab/city/building-garage.glb',
        size: 5.5,
        placements: [{ position: [6.5, 0.04, 8], rotation: -1.57 }],
      },
      {
        path: '/assets/style-lab/city/building-small-a.glb',
        size: 5.4,
        placements: [{ position: [-6.5, 0.04, -4.8], rotation: 0.35 }],
      },
      {
        path: '/assets/style-lab/city/building-small-b.glb',
        size: 5.8,
        placements: [{ position: [6.2, 0.04, -4.8], rotation: -0.28 }],
      },
      {
        path: '/assets/style-lab/city/building-small-c.glb',
        size: 5.2,
        placements: [{ position: [-7.1, 0.04, 4.2], rotation: 1.56 }],
      },
      {
        path: '/assets/style-lab/city/building-small-d.glb',
        size: 6.2,
        placements: [{ position: [7.1, 0.04, 3], rotation: -1.56 }],
      },
      {
        path: '/assets/style-lab/city/grass-trees.glb',
        size: 5,
        placements: [
          { position: [-8.2, 0.04, 9], rotation: 0.2 },
          { position: [8.8, 0.04, -1.8], rotation: -0.4 },
        ],
      },
      {
        path: '/assets/style-lab/city/pavement-fountain.glb',
        size: 5.8,
        placements: [{ position: [0, 0.04, -7.4], rotation: 0 }],
      },
    ],
  },
  medieval: {
    index: '02',
    slug: 'medieval',
    title: 'Storybook Kingdom',
    shortTitle: 'Medieval',
    kicker: 'KAYKIT / MEDIEVAL HEXAGON',
    description:
      'A compact fairytale settlement built with KayKit castles, workshops, homes, market stalls, and a windmill.',
    sourceLabel: 'KayKit Medieval Hexagon Pack',
    sourceUrl: 'https://github.com/KayKit-Game-Assets/KayKit-Medieval-Hexagon-Pack-1.0',
    license: 'CC0 1.0',
    accent: '#d89a3d',
    background: '#d9d7bf',
    fog: '#d9d7bf',
    fogDensity: 0.017,
    ground: '#829563',
    groundEdge: '#c9c39e',
    exposure: 1.05,
    camera: { fov: 25, radius: 29, minRadius: 19, maxRadius: 41, focusY: 2.35, panLimit: 8 },
    assets: [
      {
        path: '/assets/style-lab/medieval/building_castle_blue.gltf',
        size: 7.5,
        placements: [{ position: [0, 0, 3.4], rotation: 0 }],
      },
      {
        path: '/assets/style-lab/medieval/building_church_blue.gltf',
        size: 5.8,
        placements: [{ position: [-6.5, 0, -2.2], rotation: 0.45 }],
      },
      {
        path: '/assets/style-lab/medieval/building_tavern_blue.gltf',
        size: 4.8,
        placements: [{ position: [6, 0, -2.8], rotation: -0.35 }],
      },
      {
        path: '/assets/style-lab/medieval/building_blacksmith_blue.gltf',
        size: 4.6,
        placements: [{ position: [-6.8, 0, 5.5], rotation: 1.1 }],
      },
      {
        path: '/assets/style-lab/medieval/building_windmill_blue.gltf',
        size: 6.8,
        placements: [{ position: [7.2, 0, 6.6], rotation: -0.35 }],
      },
      {
        path: '/assets/style-lab/medieval/building_home_A_blue.gltf',
        size: 4.3,
        placements: [
          { position: [-2.7, 0, -5.7], rotation: 0.25 },
          { position: [2.5, 0, -6], rotation: -0.2 },
        ],
      },
      {
        path: '/assets/style-lab/medieval/building_market_blue.gltf',
        size: 4.5,
        placements: [{ position: [2.4, 0, -1.2], rotation: 1.2 }],
      },
      {
        path: '/assets/style-lab/medieval/building_well_blue.gltf',
        size: 2.8,
        placements: [{ position: [-2.2, 0, -1.2], rotation: 0 }],
      },
    ],
  },
  space: {
    index: '03',
    slug: 'space',
    title: 'Frontier Space Base',
    shortTitle: 'Space Base',
    kicker: 'KAYKIT / SPACE BASE BITS',
    description:
      'A readable lunar outpost using finished habitat modules, a garage, landing pad, solar field, and utility vehicles.',
    sourceLabel: 'KayKit Space Base Bits',
    sourceUrl: 'https://github.com/KayKit-Game-Assets/KayKit-Space-Base-Bits-1.0',
    license: 'CC0 1.0',
    accent: '#ff8e4f',
    background: '#171d2a',
    fog: '#171d2a',
    fogDensity: 0.012,
    ground: '#656879',
    groundEdge: '#a79c8a',
    exposure: 1.12,
    stars: true,
    camera: { fov: 25, radius: 30, minRadius: 20, maxRadius: 43, focusY: 2, panLimit: 9 },
    assets: [
      {
        path: '/assets/style-lab/space/landingpad_large.gltf',
        size: 9,
        placements: [{ position: [-2.5, 0, -1.5], rotation: 0 }],
      },
      {
        path: '/assets/style-lab/space/spacetruck.gltf',
        size: 3.8,
        placements: [{ position: [-2.5, 0.15, -1.6], rotation: 0.45 }],
      },
      {
        path: '/assets/style-lab/space/basemodule_A.gltf',
        size: 5.8,
        placements: [{ position: [4.5, 0, 3.4], rotation: -0.35 }],
      },
      {
        path: '/assets/style-lab/space/basemodule_B.gltf',
        size: 5.6,
        placements: [{ position: [0.5, 0, 6.6], rotation: 0.15 }],
      },
      {
        path: '/assets/style-lab/space/basemodule_C.gltf',
        size: 5.4,
        placements: [{ position: [-5.2, 0, 5.6], rotation: 0.45 }],
      },
      {
        path: '/assets/style-lab/space/basemodule_D.gltf',
        size: 5.2,
        placements: [{ position: [6.8, 0, -3.6], rotation: -0.7 }],
      },
      {
        path: '/assets/style-lab/space/basemodule_E.gltf',
        size: 5.1,
        placements: [{ position: [-7.1, 0, -4.5], rotation: 0.55 }],
      },
      {
        path: '/assets/style-lab/space/basemodule_garage.gltf',
        size: 6.2,
        placements: [{ position: [4, 0, -7], rotation: -0.2 }],
      },
      {
        path: '/assets/style-lab/space/solarpanel.gltf',
        size: 4.4,
        placements: [
          { position: [-7.5, 0, 0], rotation: 0.2 },
          { position: [-8.2, 0, 2.5], rotation: 0.2 },
          { position: [8.5, 0, 1.3], rotation: -0.25 },
        ],
      },
    ],
  },
  nature: {
    index: '04',
    slug: 'nature',
    title: 'Low-poly Wilderness',
    shortTitle: 'Nature',
    kicker: 'KAYKIT / NATURE SET',
    description:
      'A calm diorama made from finished tree clusters, wooded hills, mountains, solitary trees, and rocks.',
    sourceLabel: 'KayKit Medieval Hexagon Nature Set',
    sourceUrl: 'https://github.com/KayKit-Game-Assets/KayKit-Medieval-Hexagon-Pack-1.0',
    license: 'CC0 1.0',
    accent: '#4d9f77',
    background: '#bfd6ca',
    fog: '#bfd6ca',
    fogDensity: 0.02,
    ground: '#76945f',
    groundEdge: '#a9c18e',
    exposure: 1.02,
    camera: { fov: 25, radius: 29, minRadius: 18, maxRadius: 42, focusY: 2.3, panLimit: 9 },
    assets: [
      {
        path: '/assets/style-lab/nature/mountain_A_grass_trees.gltf',
        size: 15,
        placements: [{ position: [0, 0, 8], rotation: 0.2 }],
      },
      {
        path: '/assets/style-lab/nature/hills_A_trees.gltf',
        size: 10,
        placements: [{ position: [-7.2, 0, 2.2], rotation: 0.3 }],
      },
      {
        path: '/assets/style-lab/nature/hills_B_trees.gltf',
        size: 9.5,
        placements: [{ position: [7.3, 0, 2.8], rotation: -0.35 }],
      },
      {
        path: '/assets/style-lab/nature/trees_A_large.gltf',
        size: 6.2,
        placements: [
          { position: [-3.6, 0, -3.4], rotation: 0.5 },
          { position: [5, 0, -5], rotation: -0.15 },
        ],
      },
      {
        path: '/assets/style-lab/nature/trees_A_medium.gltf',
        size: 5.2,
        placements: [{ position: [1.7, 0, -6.2], rotation: -0.25 }],
      },
      {
        path: '/assets/style-lab/nature/trees_B_large.gltf',
        size: 6.1,
        placements: [{ position: [-7, 0, -5], rotation: 0.25 }],
      },
      {
        path: '/assets/style-lab/nature/tree_single_A.gltf',
        size: 4.8,
        placements: [
          { position: [7.5, 0, -1.7], rotation: -0.15 },
          { position: [-1.4, 0, 1.5], rotation: 0.4 },
        ],
      },
      {
        path: '/assets/style-lab/nature/rock_single_A.gltf',
        size: 2.2,
        placements: [
          { position: [3.8, 0, -1.8], rotation: 0.2 },
          { position: [-4.5, 0, -6.5], rotation: -0.4 },
        ],
      },
    ],
  },
};

export function getStyleNeighbors(key) {
  const index = STYLE_ORDER.indexOf(key);
  if (index < 0) return null;
  return {
    previous: STYLE_DEMOS[STYLE_ORDER[(index - 1 + STYLE_ORDER.length) % STYLE_ORDER.length]],
    next: STYLE_DEMOS[STYLE_ORDER[(index + 1) % STYLE_ORDER.length]],
  };
}
