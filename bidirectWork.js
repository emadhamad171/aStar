// Worker

onmessage = function (event) {
  const { graph, startNode, goalNode, id } = event.data;
  //Calculate distance

  function heuristic(node, goalNode) {
    return Math.abs(node.x - goalNode.x) + Math.abs(node.y - goalNode.y);
  }

  //A* algorithm
  function aStar(graph, startNode, goalNode) {
    const openSet = [startNode];
    const cameFrom = {};
    const gScore = {};
    const fScore = {};
    gScore[startNode.x + "," + startNode.y] = 0;
    fScore[startNode.x + "," + startNode.y] = heuristic(startNode, goalNode);
    while (openSet.length > 0) {
      // Здійснюємо пошук найкращого вузла
      let current = openSet[0];
      for (const node of openSet) {
        if (
          fScore[node.x + "," + node.y] < fScore[current.x + "," + current.y]
        ) {
          current = node;
        }
      }

      if (current.x === goalNode.x && current.y === goalNode.y) {
        const path = [];
        let tempNode = current;
        while (tempNode) {
          path.unshift(tempNode);
          tempNode = cameFrom[tempNode.x + "," + tempNode.y];
        }
        return path;
      }

      openSet.splice(openSet.indexOf(current), 1);

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          const neighbor = { x: current.x + dx, y: current.y + dy };
          if (
            neighbor.x >= 0 &&
            neighbor.x < graph.length &&
            neighbor.y >= 0 &&
            neighbor.y < graph[neighbor.x].length &&
            graph[neighbor.x][neighbor.y] === 0
          ) {
            const tentativeGScore = gScore[current.x + "," + current.y] + 1;

            if (
              tentativeGScore < gScore[neighbor.x + "," + neighbor.y] ||
              gScore[neighbor.x + "," + neighbor.y] === undefined
            ) {
              cameFrom[neighbor.x + "," + neighbor.y] = current;
              gScore[neighbor.x + "," + neighbor.y] = tentativeGScore;
              fScore[neighbor.x + "," + neighbor.y] =
                tentativeGScore + heuristic(neighbor, goalNode);

              if (
                !openSet.some(
                  (node) => node.x === neighbor.x && node.y === neighbor.y
                )
              ) {
                postMessage({
                  neighbor: current,
                  current: neighbor,
                  id,
                });
                openSet.push(neighbor);
              }
            }
          }
        }
      }
    }
    return null; // Шлях не знайдено
  }

  const path = aStar(graph, startNode, goalNode) ?? "Path not found";
  this.postMessage({ found: true, path });
};
