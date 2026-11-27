// The course from the farmyard to the woods: each stage names its scenery theme, whether the
// farmer chases or searches, which hazards it lays down and how hard he pushes.

export const STAGES = [
  {
    id: 'farmyard', name: 'The Farmyard', from: 0, to: 380, mode: 'chase', theme: 'farm',
    farmerMul: 0.91, knifeEvery: [7.5, 10], spacing: [430, 640],
    hazards: { fence: 3, hay: 3, pumpkin: 2, mud: 2 },
    tip: 'Jump fences with SPACE. Duck flying knives with DOWN.',
  },
  {
    id: 'barn', name: 'The Old Barn', from: 380, to: 700, mode: 'chase', theme: 'barn',
    farmerMul: 0.94, knifeEvery: [6, 8.5], spacing: [400, 600],
    hazards: { hay: 2, pitchfork: 3, lantern: 3, crate: 2, mud: 1 },
    tip: 'Low lanterns! Hold DOWN to duck under them.',
  },
  {
    id: 'loft', name: 'Lights Out in the Barn', from: 700, to: 780, mode: 'search', theme: 'barnDark',
    hide: 'haypile', tip: 'He lost you! Hide in the hay (DOWN) when his lantern sweeps.',
  },
  {
    id: 'kitchen', name: 'The Farmhouse Kitchen', from: 780, to: 1180, mode: 'chase', theme: 'kitchen',
    farmerMul: 0.97, knifeEvery: [5, 7], spacing: [380, 560],
    hazards: { oven: 4, knifeRack: 3, gravy: 2, pot: 2, rollingPin: 2 },
    tip: 'Ovens blast when their doors glow. Leap the flames!',
  },
  {
    id: 'pantry', name: 'Hide in the Pantry', from: 1180, to: 1260, mode: 'search', theme: 'kitchenDark',
    hide: 'cupboard', tip: 'Duck into a cupboard before the flashlight finds you.',
  },
  {
    id: 'dash', name: 'Dash for the Woods', from: 1260, to: 1500, mode: 'chase', theme: 'dusk',
    farmerMul: 1.0, knifeEvery: [3.8, 5.2], spacing: [360, 520],
    hazards: { fence: 3, pumpkin: 3, mud: 1, hay: 2, pitchfork: 1 },
    tip: 'The woods are just ahead. Sprint with RIGHT!',
  },
];

export const COURSE_END_M = STAGES[STAGES.length - 1].to;

export function stageAt(meters) {
  for (const stage of STAGES) if (meters < stage.to) return stage;
  return STAGES[STAGES.length - 1];
}

export function stageIndex(stage) {
  return STAGES.indexOf(stage);
}
