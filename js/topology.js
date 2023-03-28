import data from "../topology.json" assert { type: "json" };

// set the dimensions and margins of the graph
const margin = { top: 10, right: 30, bottom: 30, left: 40 },
	width =
		d3.select("#topology").node().offsetWidth - margin.left - margin.right,
	height =
		d3.select("#topology").node().offsetHeight - margin.top - margin.bottom;

// append the svg object to the body of the page
const full_svg = d3
	.select("#topology")
	.append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom);

const topo_svg = full_svg
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

full_svg
	.append("text")
	.attr("text-anchor", "middle")
	.attr("font-size", "20px")
	// .attr("style", "font-weight: bold")
	.attr("x", (width + margin.left + margin.right) / 2)
	.attr("y", 15)
	// .attr("y", height + margin.top + margin.bottom - 15)
	.text("Network Topology")
	.style("fill", "black");

export function draw_topology() {
	// Initialize the links
	const link = topo_svg
		.selectAll("line")
		.data(data.links)
		.enter()
		.append("line")
		.style("stroke", "#aaa");

	let sw_names = [];
	for (let i = 0; i < data.nodes; i++) {
		sw_names.push(data.nodes[i].name);
	}
	const color_scale = d3.scaleOrdinal().domain(sw_names).range(d3.schemeSet1);

	// Initialize the nodes
	const node = topo_svg
		.selectAll("circle")
		.data(data.nodes)
		.enter()
		.append("circle")
		.attr("r", 10)
		.style("fill", function (d, i) {
			return color_scale(d.name);
		});

	// Let's list the force we wanna apply on the network
	const simulation = d3
		.forceSimulation(data.nodes) // Force algorithm is applied to data.nodes
		.force(
			"link",
			d3
				.forceLink() // This force provides links between nodes
				.id(function (d) {
					return d.id;
				}) // This provide  the id of a node
				.distance(100)
				.links(data.links) // and this the list of links
		)
		.force("charge", d3.forceManyBody().strength(-50)) // This adds repulsion between nodes. Play with the -400 for the repulsion strength
		.force("center", d3.forceCenter(width / 2, height / 2)) // This force attracts nodes to the center of the svg area
		.on("end", ticked);

	// This function is run at each iteration of the force algorithm, updating the nodes position.
	function ticked() {
		link.attr("x1", function (d) {
			return d.source.x;
		})
			.attr("y1", function (d) {
				return d.source.y;
			})
			.attr("x2", function (d) {
				return d.target.x;
			})
			.attr("y2", function (d) {
				return d.target.y;
			});

		node.attr("cx", function (d) {
			return d.x;
		}).attr("cy", function (d) {
			return d.y;
		});
	}

	return [data.nodes, data.links];
}
