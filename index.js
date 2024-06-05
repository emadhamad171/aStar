const { Worker } = require("worker_threads");
const { generateGraph } = require("./generate-graph");
const path = require("path");

class Node {
  constructor(parent, position) {
    this.parent = parent;
    this.position = position;
    this.g = 0;
    this.h = 0;
    this.f = 0;
  }

  //Метод для порівняння точок
  isEqual(other) {
    return (
      this.position[0] === other.position[0] &&
      this.position[1] === other.position[1]
    );
  }
}

// Генерація графу
const graph = generateGraph(1000000);

// Задання початкової та кінцевої точки
const startNode = { x: 0, y: 0 };
const goalNode = { x: 49999, y: 49999 };

// Пошук шляху для двох потоків
const searchPathMultiThread = (startNode, goalNode) => {
  // Для перевірки, чи точки були обійдені
  const fromStartObject = {};
  const fromEndObject = {};
  // Для зберігання шляху
  const cameFromStart = {};
  const cameFromEnd = {};
  // Перевірка, чи шлях знайдено
  let isPathFound = false;
  let currentNode;
  let startTime;
  // Стореня воркерів
  const workerEnd = new Worker(path.resolve(__dirname, "./worker.js"));
  const workerStart = new Worker(path.resolve(__dirname, "./worker.js"));
  // Стореня шляху для окремого воркера
  const getPath = (cameFrom, current) => {
    const path = [];
    let tempNode = current;
    while (tempNode) {
      path.unshift(tempNode);
      tempNode = cameFrom[tempNode.x + "," + tempNode.y];
    }
    return path;
  };
  // Складання шляху для двох воркерів
  const compilePath = (cameFromEnd, cameFromStart) => {
    // Створення шляху з кінцевої точки
    const [_, ...lastPart] = getPath(cameFromEnd, currentNode).reverse();
    // Конкатинація шляхів для початкової точки
    const path = [...getPath(cameFromStart, currentNode), ...lastPart];
    return path;
  };
  // Закінчення роботи, якщо шлях знайдено спільно
  const finish = async (startTime) => {
    if (isPathFound) return;
    const endTime = Date.now();
    console.log(`[Multi-thread] Duration: ${(endTime - startTime) / 1000}s`);
    compilePath(cameFromEnd, cameFromStart);
    isPathFound = true;
    return;
  };
  //#########################################
  const onMessageFromStart = async (data) => {
    if (!isPathFound) {
      // Якщо шлях знайдено раніше синхронізації
      if (data?.found) {
        console.log("First Found.");
        isPathFound = true;
        workerStart.terminate();
      }
      // Додання відвіданої точки в список
      const textData = JSON.stringify(data.current);
      fromStartObject[textData] = true;
      currentNode = data.current;
      cameFromStart[data.current.x + "," + data.current.y] = data.neighbor;
      // Перевірка, чи була точка відвідана іншим потоком
      if (fromEndObject[textData]) {
        // Формування шляху
        finish(startTime, currentNode);
        console.log("Потоки зійшлися на точці: ", data.current);
        // Закінчення роботи воркерів
        isPathFound = true;
        workerEnd.terminate();
        workerStart.terminate();
      }
    }
  };
  const onMessageFromEnd = (data) => {
    if (!isPathFound) {
      // Якщо шлях знайдено раніше синхронізації
      if (data?.found) {
        console.log("Second Found.");
        isPathFound = true;
        workerEnd.terminate();
        workerStart.terminate();
      }
      // Додання відвіданої точки в список
      const textData = JSON.stringify(data.current);
      fromEndObject[textData] = true;
      currentNode = data.current;
      cameFromEnd[data.current.x + "," + data.current.y] = data.neighbor;
      // Перевірка, чи була точка відвідана іншим потоком
      if (fromStartObject[textData]) {
        finish(startTime, cameFromEnd, cameFromStart, currentNode);
        console.log("Потоки зійшлися на точці: ", data.current);
        isFirstTurn = false;
        isSecondTurn = false;
        workerEnd.terminate();
        workerStart.terminate();
      }
    }
  };
  // Запуск воркерів для пошуку
  workerStart.postMessage({
    type: "start",
    name: "start",
    graph,
    startNode,
    goalNode,
    id: 0,
  });
  workerEnd.postMessage({
    type: "start",
    name: "end",
    graph,
    startNode: goalNode,
    goalNode: startNode,
    id: 1,
  });
  startTime = Date.now();
  // Прослуховування воркерів
  workerStart.on("message", onMessageFromStart);
  workerEnd.on("message", onMessageFromEnd);
};

// Пошук шляху для одного потоку
const searchPathSync = (startNode, goalNode) => {
  // Форматування цільових точок
  const syncStartNode = Object.values(startNode);
  const syncGoalNode = Object.values(goalNode);

  // Алгоритм пошуку шляху A*
  const astar = (maze, start, end) => {
    const startNode = new Node(null, start);
    startNode.g = startNode.h = startNode.f = 0;
    const endNode = new Node(null, end);
    endNode.g = endNode.h = endNode.f = 0;

    const openList = [];
    const closedList = [];

    openList.push(startNode);

    // Доки список відкритих точок не пустий
    while (openList.length > 0) {
      let current = openList[0];
      let currentIndex = 0;

      for (let i = 0; i < openList.length; i++) {
        if (openList[i].f < current.f) {
          current = openList[i];
          currentIndex = i;
        }
      }
      // Прибираємо поточну точку з відкритого списку
      openList.splice(currentIndex, 1);
      // Переводимо точку в закритий список
      closedList.push(current);

      // Якщо ми знайшли кінцеву точку
      if (current.isEqual(endNode)) {
        console.log('Точок обійдено: ',closedList.length)
        const path = [];
        // Генеруємо шлях
        while (current !== null) {  path.push(current.position);  current = current.parent; }
        return path.reverse();
      }

      const children = [];
      // Можливі ходи
      const moves = [ [0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [-1, 1], [1, -1], [1, 1],];

      // Перевірка сусідів
      for (const move of moves) {
        const newPosition = [
          current.position[0] + move[0],
          current.position[1] + move[1],
        ];
        // Перевірка на виходження за межі масиву
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
      // Перевірка кожного сусіда
      for (const child of children) {
        for (const closedChild of closedList) {
          if (child.isEqual(closedChild)) {
            continue;
          }
        }

        child.g = current.g + 1;
        child.h =
          Math.pow(child.position[0] - endNode.position[0], 2) +
          Math.pow(child.position[1] - endNode.position[1], 2);
        child.f = child.g + child.h;
        // Перевірка відкритого списку
        for (const openNode of openList) {
          if (child.isEqual(openNode) && child.g > openNode.g) {
            continue;
          }
        }
        // Додаємо сусіда в відкритий список
        openList.push(child);
      }
    }

    return null;
  };
  // Пошук шляху
  const path = astar(graph, syncStartNode, syncGoalNode);
};

// Тестування для одного потоку
const testSingleThread = (startNode, goalNode) => {
  console.log("Початок пошуку шляху для одного потоку...");
  // Початок відліку
  const startTimeForSingle = Date.now();
  // Пошук шляху
  searchPathSync(startNode, goalNode);
  // Кінець відліку
  const endTimeForSingle = Date.now();
  console.log(
    `[Single-thread] тривалість пошуку: ${
      (endTimeForSingle - startTimeForSingle) / 1000
    }s\n`
  );
};

//Тестування для двох потоків
const testMultiThread = (startNode, goalNode) => {
  console.log("Початок пошуку шляху для двох потоків...");
  searchPathMultiThread(startNode, goalNode);
};

//Порівняння багатопоточного обходу з однопоточним обходои
const testWithData = (startNode, goalNode) => {
  console.log("Порівняння обходу графа для:");
  console.log("Початкова точка:", startNode);
  console.log("Кінцева точка:", goalNode);
  testSingleThread(startNode, goalNode);
  testMultiThread(startNode, goalNode);
};

testWithData(startNode, goalNode);
