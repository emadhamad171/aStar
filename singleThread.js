class Node {
  constructor(parent, position) {
    this.parent = parent;
    this.position = position;
    this.g = 0;
    this.h = 0;
    this.f = 0;
  }

  isEqual(other) {
    return (
      this.position[0] === other.position[0] &&
      this.position[1] === other.position[1]
    );
  }
}

function astar(maze, start, end) {
  const startNode = new Node(null, start);
  startNode.g = startNode.h = startNode.f = 0;
  const endNode = new Node(null, end);
  endNode.g = endNode.h = endNode.f = 0;

  const openList = [];
  const closedList = [];

  openList.push(startNode);

  while (openList.length > 0) {
    let current = openList[0];
    let currentIndex = 0;

    for (let i = 0; i < openList.length; i++) {
      if (openList[i].f < current.f) {
        current = openList[i];
        currentIndex = i;
      }
    }

    openList.splice(currentIndex, 1);
    closedList.push(current);

    if (current.isEqual(endNode)) {
      const path = [];
      while (current !== null) {
        path.push(current.position);
        current = current.parent;
      }
      return path.reverse();
    }

    const children = [];
    const moves = [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];
    for (const move of moves) {
      const newPosition = [
        current.position[0] + move[0],
        current.position[1] + move[1],
      ];
      if (
        newPosition[0] >= 0 &&
        newPosition[0] < maze.length &&
        newPosition[1] >= 0 &&
        newPosition[1] < maze[newPosition[0]].length &&
        maze[newPosition[0]][newPosition[1]] === 0
      ) {
        const newNode = new Node(current, newPosition);
        children.push(newNode);
      }
    }
    for (const child of children) {
      for (const closedChild of closedList) {
        if (child.isEqual(closedChild)) continue;
      }
      child.g = current.g + 1;
      child.h =
        Math.pow(child.position[0] - endNode.position[0], 2) +
        Math.pow(child.position[1] - endNode.position[1], 2);
      child.f = child.g + child.h;
      for (const openNode of openList) {
        if (child.isEqual(openNode) && child.g > openNode.g) {
          continue;
        }
      }
      openList.push(child);
    }
  }

  return null;
}

function main() {
  const generateGraph = require("./generate-graph");
  const maze = generateGraph(100);

  const start = [0, 0];
  const end = [99, 99];

  const path = astar(maze, start, end);
  console.log(path);
}

const startTime = Date.now();
main();
const endTime = Date.now();

console.log(`[Single thread] Duration: ${(endTime - startTime) / 1000}s`);
