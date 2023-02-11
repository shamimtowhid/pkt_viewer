//import {select} from 'd3'; //This is ES6 syntax, not supported by all browser

//d3.select("#text").style("color", "green");

const width = window.innerWidth;
const height = window.innerHeight;

const svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);
