const generateGraph = require("./generate-graph");

const graph = generateGraph(10000);

const getPath = (cameFrom, current) => {
  const path = [];
  let tempNode = current;
  while (tempNode) {
    path.unshift(tempNode);
    tempNode = cameFrom[tempNode.x + "," + tempNode.y];
  }
  return path;
};

const compilePuth = (cameFromEnd, cameFromStart, currE, currS) => {
  const [garbage, ...lastPart] = getPath(cameFromEnd, currE).reverse();
  console.log(`path:`);
  const path = [...getPath(cameFromStart, currS), ...lastPart];

  console.log(path);
};

function finish(
  startTime,
  cameFromEnd,
  cameFromStart,
  currentNode,
  worker1,
  worker2
) {
  const endTime = Date.now();
  console.log(`[Multi-thread] Duration: ${(endTime - startTime) / 1000}s `);
  compilePuth(cameFromEnd, cameFromStart, currentNode, currentNode);
  worker1.terminate();
  worker2.terminate();
}
const startNode = { x: 0, y: 0 };
const goalNode = { x: 99999, y: 99999 };

const fromStartObject = {};
const fromEndObject = {};

const cameFromStart = {};
const cameFromEnd = {};

let currentNode;

function main() {
  const startTime = Date.now();

  const worker1 = new Worker("bidirectWork.js");
  worker1.postMessage({
    graph,
    startNode: startNode,
    goalNode: goalNode,
    id: 0,
  });

  worker1.onmessage = (e) => {
    if (e.data?.found) {
      console.log(`Thread [1] Finished before connection:`);
      console.log(e.data.path);
      const endTime = Date.now();
      console.log(`Duration: ${(endTime - startTime) / 1000}s `);
      worker1.terminate();
      worker2.terminate();
      return;
    }
    const textData = JSON.stringify(e.data.current);
    fromStartObject[textData] = true;
    currentNode = e.data.current;
    cameFromStart[e.data.current.x + "," + e.data.current.y] = e.data.neighbor;
    if (fromEndObject[textData]) {
      finish(
        startTime,
        cameFromEnd,
        cameFromStart,
        currentNode,
        worker1,
        worker2
      );
    }
  };

  const worker2 = new Worker("bidirectWork.js");

  worker2.postMessage({
    graph,
    startNode: goalNode,
    goalNode: startNode,
    id: 1,
  });
  worker2.onmessage = (e) => {
    if (e.data?.found) {
      console.log(`Thread [2] Finished before connection: ${e.data.path}`);
      const endTime = Date.now();
      console.log(`Duration: ${(endTime - startTime) / 1000}s `);

      worker1.terminate();
      worker2.terminate();
      return;
    }

    const textData = JSON.stringify(e.data.current);
    fromEndObject[textData] = true;

    currentNode = e.data.current;
    cameFromEnd[e.data.current.x + "," + e.data.current.y] = e.data.neighbor;

    if (fromStartObject[textData]) {
      finish(
        startTime,
        cameFromEnd,
        cameFromStart,
        currentNode,
        worker1,
        worker2
      );
    }
  };
}

main();
