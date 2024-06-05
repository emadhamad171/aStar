// Файл воркера
const { parentPort } = require("worker_threads");

parentPort.on("message", (message) => {
  const { graph, startNode, goalNode, id } = message;

  // Функція для обчислення евристичної відстані
  function heuristic(node, goalNode) {
    return Math.abs(node.x - goalNode.x) + Math.abs(node.y - goalNode.y);
  }

  //A* алгоритм
  function aStar(graph, startNode, goalNode) {
    // Відкритий та закритий список
    const openSet = [startNode];
    const cameFrom = {};

    // gScore - вартість шляху від початкової точки до даної
    // fScore - gScore + евристична відстань
    const gScore = {};
    const fScore = {};

    gScore[startNode.x + "," + startNode.y] = 0;
    fScore[startNode.x + "," + startNode.y] = heuristic(startNode, goalNode);
    // Пошук шляху
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
      // Перевірка, чи досягнуто кінцевої точки
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
      // Перевірка сусідів
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          const neighbor = { x: current.x + dx, y: current.y + dy };
          // Перевірка, чи вони в межах графу та не є стіною
          if (
            neighbor.x >= 0 &&
            neighbor.x < graph.length &&
            neighbor.y >= 0 &&
            neighbor.y < graph[neighbor.x].length &&
            graph[neighbor.x][neighbor.y] === 0
          ) {
            const tentativeGScore = gScore[current.x + "," + current.y] + 1;

            // Перевірка, чи шлях до даної точки коротший
            if (
              tentativeGScore < gScore[neighbor.x + "," + neighbor.y] ||
              gScore[neighbor.x + "," + neighbor.y] === undefined
            ) {
              cameFrom[neighbor.x + "," + neighbor.y] = current;
              gScore[neighbor.x + "," + neighbor.y] = tentativeGScore;
              fScore[neighbor.x + "," + neighbor.y] =
                tentativeGScore + heuristic(neighbor, goalNode);
              // Перевірка, чи вузол вже відвіданий
              if (
                !openSet.some(
                  (node) => node.x === neighbor.x && node.y === neighbor.y
                )
              ) {
                // Відправка повідомлення про відвідування вузла
                parentPort.postMessage({
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
  // Запуск алгоритму
  const path = aStar(graph, startNode, goalNode) ?? "Path not found";
  // Відправка результату
  parentPort.postMessage({ found: true, path, current: goalNode });
  return;
});
