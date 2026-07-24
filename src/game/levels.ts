export interface LevelConfig {
  id: number;
  name: string;
  gridSize: number;
  obstacleCount: number;
  targetTile: number;
  targetScore: number;
  movesLimit?: number;
  frozenTilesCount?: number;
  magnetTilesCount?: number;
  doubleScoreTilesCount?: number;
  rewardCoins: number;
}

export const CAMPAIGN_LEVELS: LevelConfig[] = Array.from({ length: 50 }, (_, i) => {
  const id = i + 1;
  
  // Grid size progression: starts at 3x3 or 4x4, mixes sizes
  let gridSize = 4;
  if ([3, 8, 15, 23, 31, 40].includes(id)) gridSize = 3; // Extreme levels
  else if ([7, 14, 22, 30, 39, 48].includes(id)) gridSize = 5; // Relaxed / spacious levels
  else if ([45, 50].includes(id)) gridSize = 6; // Mega levels

  // Obstacle count increases with level
  let obstacleCount = 0;
  if (gridSize === 4) {
    obstacleCount = id < 10 ? 0 : id < 25 ? 1 : id < 40 ? 2 : 3;
  } else if (gridSize === 5) {
    obstacleCount = id < 20 ? 1 : id < 35 ? 2 : 3;
  } else if (gridSize === 6) {
    obstacleCount = 4;
  } else if (gridSize === 3) {
    obstacleCount = id < 10 ? 0 : 1; // max 1 obstacle on 3x3 to make it playable
  }

  // Target Tile progression
  let targetTile = 2024;
  if (id < 5) targetTile = 128;
  else if (id < 12) targetTile = 256;
  else if (id < 20) targetTile = 512;
  else if (id < 30) targetTile = 1024;
  else if (id < 45) targetTile = 2024;
  else targetTile = 4096;

  // Target Score progression
  const targetScore = targetTile * 4 + id * 100;

  // Optional move limit to create urgency in higher levels
  const movesLimit = id > 10 && id % 3 === 0 ? 50 + (gridSize * 15) - (id % 10) * 2 : undefined;

  // Special tiles counts
  const frozenTilesCount = id > 8 && id % 4 === 1 ? 1 : id > 20 && id % 4 === 1 ? 2 : undefined;
  const magnetTilesCount = id > 12 && id % 4 === 2 ? 1 : undefined;
  const doubleScoreTilesCount = id > 10 && id % 4 === 3 ? 1 : undefined;

  const rewardCoins = 50 + id * 10;

  return {
    id,
    name: `Level ${id}: ${getLevelTitle(id)}`,
    gridSize,
    obstacleCount,
    targetTile,
    targetScore,
    movesLimit,
    frozenTilesCount,
    magnetTilesCount,
    doubleScoreTilesCount,
    rewardCoins
  };
});

function getLevelTitle(id: number): string {
  const titles = [
    "The Beginning", "Grid Sandbox", "Three's Company", "Merge Master", "First Obstacle",
    "Ice Age", "Spacious Fields", "Quick Steps", "Lava Blocks", "Double Power",
    "Stone Age", "The Magnet Pull", "Tight Squeeze", "Frozen Core", "Grid Shift",
    "Pressure Cooker", "Magnetic Field", "Double or Nothing", "Obstacle Course", "Golden Merges",
    "Ice Slider", "Spacious Valley", "No Left Swipes", "The 1024 Summit", "Stone Wall",
    "Magnet Storm", "Frozen Peak", "Fast Fusion", "Megagrid", "The 2024 Gateway",
    "Frozen Prison", "Obsidian Path", "Magnet Matrix", "Double Ring", "The Maze",
    "Ice Cap", "Tectonic Plates", "Zero Waste", "Spacious Plains", "Vortex",
    "Glacier Slide", "Magnet Mountain", "Gold Rush", "The Core", "Colossus Grid",
    "Absolute Zero", "Magnetic Pole", "Triumphant Ascent", "Final Gates", "The 4096 Sanctuary"
  ];
  return titles[(id - 1) % titles.length];
}
