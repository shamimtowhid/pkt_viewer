//import {select} from 'd3'; //This is ES6 syntax, not supported by all browser

//d3.select("#text").style("color", "green");

const width = window.innerWidth;
const height = window.innerHeight;

const svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

//const { json } = d3;

const jsonUrl = ["https://gist.githubusercontent.com/", "shamimtowhid/",
    "58112041b5fd9787fe9c71cebebd08a2/",
    "raw/4673fda42780ae0a6c0319a068544a51db65260a/",
    "network_data.json"].join("");

const parseObject = (d) => {
    d.rcv_time = +d.rcv_time;
    d.send_time = +d.send_time;
    return d;
};


const main = async () => {
    const data = await d3.json(jsonUrl)
        .catch(error => {
            console.error(error);
        });
    let parsedData = data.map(parseObject);

    // return min and max for domain
    const x = d3.scaleLinear()
        .domain(d3.extent(parsedData, xValue))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain(d3.extent(parsedData, yValue))
        .range([height, 0]); // this range is flipped because origin is at upper left corner

    // acts as a setter if we provide a value
    // if we do not provide a value like below, it acts as a getter
    //console.log(x.domain());

    //console.log(x.range());

    // svg.selectAll("circle")
    //    .data(parsedData)
    //    .join("circle")
    //    .attr("cx",)
    //    .attr("cy",)
    //    .attr("r",)
};

main();

const xValue = (d) => {
    const ts1 = 1675921681.915128;
    return d.send_time - ts1; // return difference between two timestamp in seconds
};

const yValue = (d) => {
    let depth = 0;
    for (let i = 0; i < d.swtraces.length; i++) {
        depth = depth + d.swtraces[i].qdepth;
    }
    return depth
};


// //console.log(jsonUrl);
// d3.json(jsonUrl).then(data => {
//     //console.log(data);
//     let parsedData = data.map(parseObject);
//     console.log(parsedData);
// })
//     .catch(error => {
//         console.error(error);
//     });

//let t = 0;

//setInterval(() => {
//    const n = 10 + Math.sin(t) * 5;
//    const data = d3.range(n).map(d => ({
//        x: d * 60 + 50,
//        y: 250 + Math.sin(d * 0.5 + t) * 220
//    }));

    // join is the merge of enter and update selection
    // join also call the exit selection that removes the
    // elements from DOM for which no data is associated

//    const circles = svg
//        .selectAll("circle")
//        .data(data)
//        .join("circle")
//        .attr("r", 20)
//        .attr("cx", (d) => d.x)
//        .attr("cy", (d) => d.y);

//    t = t + 0.1;

//}, 1000 / 60);