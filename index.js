//import {select} from 'd3'; //This is ES6 syntax, not supported by all browser

//d3.select("#text").style("color", "green");

const width = window.innerWidth;
const height = window.innerHeight;

const svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);


let t = 0;

setInterval(() => {
    const n = 10 + Math.sin(t) * 5;
    const data = d3.range(n).map(d => ({
        x: d * 60 + 50,
        y: 250 + Math.sin(d * 0.5 + t) * 220
    }));

    // join is the merge of enter and update selection
    // join also call the exit selection that removes the 
    // elements from DOM for which no data is associated

    const circles = svg
        .selectAll("circle")
        .data(data)
        .join("circle")
        .attr("r", 20)
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y);

    t = t + 0.1;

}, 1000 / 60);