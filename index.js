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

    const data = d3.range(15).map(d => ({
        x: d * 60 + 50,
        y: 250 + Math.sin(d * 0.5 + t) * 220
    }));

    const circles = svg.selectAll("circle").data(data);
    circles.enter().append("circle").attr("r", 20);
    circles
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y);

    t = t + 0.1;

}, 50);