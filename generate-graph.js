const generateGraph = (l) => {
    const graph = Array.from({ length: l }).fill(
        Array.from({ length: l }).fill(0)
    );
    return graph;
};


module.exports = {
    generateGraph
}
