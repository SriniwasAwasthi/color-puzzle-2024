export type Cell = {
  value: number;
  id: string;
  isNew: boolean;
  isMerged: boolean;
  isObstacle?: boolean;
  isFrozen?: boolean;
  isMagnet?: boolean;
  isDoubleScore?: boolean;
};

export type Grid = (Cell | null)[][];

export type Direction = "up" | "down" | "left" | "right";

let idCounter = 0;
const makeId = () => `tile-${++idCounter}-${Date.now()}`;

export function createEmptyGrid(size: number = 4): Grid {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

export function addRandomTile(grid: Grid): Grid {
  const size = grid.length;
  const empty: [number, number][] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!grid[r][c]) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return grid;

  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  const newGrid = grid.map((row) => [...row]) as Grid;
  newGrid[r][c] = { value, id: makeId(), isNew: true, isMerged: false };
  return newGrid;
}

export function addSpecialTile(grid: Grid, type: "frozen" | "magnet" | "double"): Grid {
  const size = grid.length;
  const empty: [number, number][] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!grid[r][c]) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return grid;

  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  const newGrid = grid.map((row) => [...row]) as Grid;
  newGrid[r][c] = {
    value,
    id: makeId(),
    isNew: true,
    isMerged: false,
    isFrozen: type === "frozen",
    isMagnet: type === "magnet",
    isDoubleScore: type === "double",
  };
  return newGrid;
}

export function clearAnimations(grid: Grid): Grid {
  return grid.map((row) =>
    row.map((cell) =>
      cell ? { ...cell, isNew: false, isMerged: false } : null
    )
  ) as Grid;
}

function slideRow(row: (Cell | null)[]): { row: (Cell | null)[]; score: number; mergedCount: number; doubleMerged: boolean } {
  const n = row.length;
  const result: (Cell | null)[] = row.map(c => c ? { ...c, isMerged: false, isNew: false } : null);
  let score = 0;
  let mergedCount = 0;
  let doubleMerged = false;

  for (let i = 1; i < n; i++) {
    const current = result[i];
    if (!current || current.isObstacle || current.isFrozen) {
      continue;
    }

    let targetIdx = i;
    for (let j = i - 1; j >= 0; j--) {
      const target = result[j];
      if (!target) {
        targetIdx = j;
      } else {
        if (target.value === current.value && !target.isMerged && !target.isObstacle) {
          const mergedValue = current.value * 2;
          score += mergedValue;
          mergedCount++;
          
          const isDouble = target.isDoubleScore || current.isDoubleScore;
          if (isDouble) doubleMerged = true;

          result[j] = {
            value: mergedValue,
            id: makeId(),
            isNew: false,
            isMerged: true,
            isFrozen: false, // thaws!
            isMagnet: target.isMagnet || current.isMagnet, // preserve magnet status
            isDoubleScore: isDouble
          };
          result[i] = null;
          targetIdx = -1;
        }
        break;
      }
    }

    if (targetIdx !== -1 && targetIdx !== i) {
      result[targetIdx] = current;
      result[i] = null;
    }
  }

  return { row: result, score, mergedCount, doubleMerged };
}

function transpose(grid: Grid): Grid {
  const n = grid.length;
  const t: Grid = Array.from({ length: n }, () => Array(n).fill(null));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      t[c][r] = grid[r][c];
    }
  }
  return t;
}

export function move(
  grid: Grid,
  direction: Direction
): { grid: Grid; score: number; moved: boolean; mergedCount: number; doubleMerged: boolean } {
  let workGrid = grid.map((row) => [...row]) as Grid;
  let totalScore = 0;
  let totalMergedCount = 0;
  let doubleMerged = false;
  let moved = false;

  const getFlatSig = (g: Grid) => g.flat().map((c) => {
    if (!c) return "null";
    return `${c.value}-${c.isObstacle ? "obs" : "val"}-${c.isFrozen ? "fr" : "th"}-${c.isMagnet ? "mag" : "no"}`;
  }).join(",");

  const originalFlat = getFlatSig(workGrid);

  if (direction === "right") {
    workGrid = workGrid.map((row) => [...row].reverse()) as Grid;
  } else if (direction === "up") {
    workGrid = transpose(workGrid);
  } else if (direction === "down") {
    workGrid = transpose(workGrid);
    workGrid = workGrid.map((row) => [...row].reverse()) as Grid;
  }

  const newRows = workGrid.map((row) => {
    const { row: slid, score, mergedCount, doubleMerged: dm } = slideRow(row);
    totalScore += score;
    totalMergedCount += mergedCount;
    if (dm) doubleMerged = true;
    return slid;
  });

  workGrid = newRows as Grid;

  if (direction === "right") {
    workGrid = workGrid.map((row) => [...row].reverse()) as Grid;
  } else if (direction === "up") {
    workGrid = transpose(workGrid);
  } else if (direction === "down") {
    workGrid = workGrid.map((row) => [...row].reverse()) as Grid;
    workGrid = transpose(workGrid);
  }

  const newFlat = getFlatSig(workGrid);
  moved = originalFlat !== newFlat;

  return { grid: workGrid, score: totalScore, moved, mergedCount: totalMergedCount, doubleMerged };
}

export function applyMagnetPull(grid: Grid): { grid: Grid; pulled: boolean } {
  const size = grid.length;
  let newGrid = grid.map(row => row ? [...row] : []) as Grid;
  let pulled = false;

  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1]
  ];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = newGrid[r][c];
      if (cell && cell.isMagnet) {
        const val = cell.value;
        for (const [dr, dc] of directions) {
          let currR = r + dr;
          let currC = c + dc;
          
          while (currR >= 0 && currR < size && currC >= 0 && currC < size) {
            const target = newGrid[currR][currC];
            if (target) {
              if (target.value === val && !target.isMagnet && !target.isObstacle) {
                const stepR = currR - dr;
                const stepC = currC - dc;
                if (stepR === r && stepC === c) {
                  break;
                }
                if (!newGrid[stepR][stepC]) {
                  newGrid[stepR][stepC] = { ...target, isNew: false, isMerged: false };
                  newGrid[currR][currC] = null;
                  pulled = true;
                }
              }
              break;
            }
            currR += dr;
            currC += dc;
          }
          if (pulled) break;
        }
      }
      if (pulled) break;
    }
  }

  return { grid: newGrid, pulled };
}

export function checkWin(grid: Grid, target: number): boolean {
  return grid.flat().some((c) => c && !c.isObstacle && c.value >= target);
}

export function checkGameOver(grid: Grid): boolean {
  const n = grid.length;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!grid[r][c]) return false;
      if (grid[r][c]?.isObstacle || grid[r][c]?.isFrozen) continue;

      if (c + 1 < n && !grid[r][c + 1]?.isObstacle && grid[r][c]!.value === grid[r][c + 1]?.value) {
        return false;
      }
      if (r + 1 < n && !grid[r + 1]?.[c]?.isObstacle && grid[r][c]!.value === grid[r + 1]?.[c]?.value) {
        return false;
      }
    }
  }
  return true;
}

export function getHighestTile(grid: Grid): number {
  return Math.max(0, ...grid.flat().map((c) => (c && !c.isObstacle ? c.value : 0)));
}

export function initGame(size: number = 4, obstacleCount: number = 0): Grid {
  let grid = createEmptyGrid(size);

  let addedObstacles = 0;
  while (addedObstacles < obstacleCount) {
    const r = Math.floor(Math.random() * size);
    const c = Math.floor(Math.random() * size);
    if (!grid[r][c]) {
      grid[r][c] = { value: 0, id: `obstacle-${addedObstacles}-${Date.now()}`, isNew: false, isMerged: false, isObstacle: true };
      addedObstacles++;
    }
  }

  grid = addRandomTile(grid);
  grid = addRandomTile(grid);
  return grid;
}

export function initGameLevel(
  size: number,
  obstacleCount: number,
  frozenCount: number = 0,
  magnetCount: number = 0,
  doubleCount: number = 0
): Grid {
  let grid = createEmptyGrid(size);

  let addedObstacles = 0;
  while (addedObstacles < obstacleCount) {
    const r = Math.floor(Math.random() * size);
    const c = Math.floor(Math.random() * size);
    if (!grid[r][c]) {
      grid[r][c] = { value: 0, id: `obstacle-${addedObstacles}-${Date.now()}`, isNew: false, isMerged: false, isObstacle: true };
      addedObstacles++;
    }
  }

  grid = addRandomTile(grid);
  grid = addRandomTile(grid);

  for (let i = 0; i < frozenCount; i++) grid = addSpecialTile(grid, "frozen");
  for (let i = 0; i < magnetCount; i++) grid = addSpecialTile(grid, "magnet");
  for (let i = 0; i < doubleCount; i++) grid = addSpecialTile(grid, "double");

  return grid;
}

export function addSeededTile(grid: Grid, rng: () => number): Grid {
  const size = grid.length;
  const empty: [number, number][] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!grid[r][c]) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return grid;
  const [r, c] = empty[Math.floor(rng() * empty.length)];
  const value = rng() < 0.9 ? 2 : 4;
  const newGrid = grid.map((row) => [...row]) as Grid;
  newGrid[r][c] = { value, id: makeId(), isNew: true, isMerged: false };
  return newGrid;
}

export function initGameSeeded(rng: () => number, size: number = 4, obstacleCount: number = 0): Grid {
  let grid = createEmptyGrid(size);

  let addedObstacles = 0;
  while (addedObstacles < obstacleCount) {
    const r = Math.floor(rng() * size);
    const c = Math.floor(rng() * size);
    if (!grid[r][c]) {
      grid[r][c] = { value: 0, id: `obstacle-${addedObstacles}-${Date.now()}`, isNew: false, isMerged: false, isObstacle: true };
      addedObstacles++;
    }
  }

  grid = addSeededTile(grid, rng);
  grid = addSeededTile(grid, rng);
  return grid;
}
