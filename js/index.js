import { scatter_plot } from "./scatter.js";
import { bar_plot } from "./group_bar.js";
import { tabulate } from "./table.js";

//const width = window.innerWidth;
//const height = window.innerHeight;

const jsonUrl = [
	"https://gist.githubusercontent.com/",
	"shamimtowhid/",
	"58112041b5fd9787fe9c71cebebd08a2/",
	"raw/4673fda42780ae0a6c0319a068544a51db65260a/",
	"network_data.json",
].join("");

// converting string data to float
const parseObject = (d) => {
	d.rcv_time = +d.rcv_time;
	d.send_time = +d.send_time;
	return d;
};

// downloading data and create plots
const main = async () => {
	const data = await d3.json(jsonUrl).catch((error) => {
		console.error(error);
	});

	const parsedData = data.map(parseObject);

	// scatter plot
	const [scatter_svg, circles] = scatter_plot(parsedData);

	// bar plot
	const bar_svg = bar_plot(parsedData);
	// topology plot

	// adding brush activity to scatter_svg
	// the "on" method takes two parameters: typenames and listener
	// typenames define when to call the listener function
	// listener function defines what to do
	// example typenames: "start brush end"
	const brush = d3.brush().on("end", brushed);
	scatter_svg.append("g").attr("id", "brush").call(brush);

	function brushed({ selection }) {
		// selection containes the x,y coordinates of starting and end position
		const value = new Set();
		// removing all the large circles resulted from previous selection operation
		d3.selectAll("#large_circle").remove();

		if (selection) {
			const [[x0, y0], [x1, y1]] = selection;
			circles
				.filter(function () {
					// returns only circles that have display=inline
					return d3.select(this).attr("display") === "inline";
				})
				.filter((d) => {
					if (x0 <= d.x && d.x < x1 && y0 <= d.y && d.y < y1) {
						value.add(d);
					}
				});
		} else {
			// when clicked on the svg without selection
			d3.select("#added_table").remove();
			d3.select("#table_msg").text("No packet is selected"); // no packet selected
		}
		// generate table based on the selected circles
		if (value.size > 0) {
			d3.select("#added_table").remove();
			d3.select("#table_msg").text(
				`Number of selected packet: ${value.size}`
			);
			tabulate(
				value,
				["source_ip", "destination_ip", "size_in_bytes"],
				scatter_svg
			);
		} else {
			d3.select("#added_table").remove();
			d3.select("#table_msg").text("No packet is selected"); // no packet selected
		}
	}
};

main();

// adding tooltop
//circles.append("title").text((d) => `${d.label}`);

// Save the current position of the circles in the stacking order
//const initialOrder = circles.order();

// chaning the z axis of a circle on hover
// svg.selectAll(".dot")
// 	.on("mouseover", function () {
// 		d3.select(this)
// 			.attr("r", radius * 1.2)
// 			.style("stroke-width", 2);
// 		d3.select(this).raise();
// 		//this.parentNode.appendChild(this);
// 	})
// 	.on("mouseout", function () {
// 		d3.select(this).attr("r", radius).style("stroke-width", 0.5);
// 		circles.order(initialOrder);
// 	});

// code for moving circles, (sin wave)

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