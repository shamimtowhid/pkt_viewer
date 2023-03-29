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

const tooltip = d3
	.select("#topology")
	.append("div")
	.style("position", "absolute")
	.style("z-index", "10")
	.style("visibility", "hidden")
	.style("background-color", "white")
	.style("border", "solid")
	.style("border-width", "2px")
	.style("border-radius", "5px")
	.style("padding", "5px");

const mouseover = function (event, d) {
	tooltip.style("visibility", "visible");
	d3.select(this).style("stroke", "black");
};

const mousemove = function (event, d) {
	tooltip
		.html(d.name)
		.style("left", event.pageX + 15 + "px")
		.style("top", event.pageY - 5 + "px");
};

const mouseleave = function (d) {
	tooltip.style("visibility", "hidden");
	d3.select(this).style("stroke", "none");
};

export function draw_topology(pckt_data) {
	// Initialize the links
	const link = topo_svg
		.selectAll("line")
		.data(data.links)
		.enter()
		.append("line")
		.attr("class", "nodelink")
		.attr("source", function (d) {
			return d.source;
		})
		.attr("target", function (d) {
			return d.target;
		})
		.style("stroke", "black")
		.style("stroke-width", 1);

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
		})
		.on("mouseover", mouseover)
		.on("mousemove", mousemove)
		.on("mouseleave", mouseleave);

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
				.distance(50)
				.links(data.links) // and this the list of links
		)
		.force("charge", d3.forceManyBody().strength(-10)) // This adds repulsion between nodes. Play with the -400 for the repulsion strength
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

	update_link(pckt_data);

	return data.nodes;
}

export function update_link(pckt_data) {
	d3.selectAll("line.nodelink").style("stroke-width", 1);
	// pckt_data is an array
	let counter = {};
	let min_val = 0,
		max_val = 0;
	for (let i = 0; i < pckt_data.length; i++) {
		const tmp_data = pckt_data[i];
		let tmp_path = [];
		for (let j = 0; j < tmp_data.swtraces.length; j++) {
			tmp_path.push(tmp_data.swtraces[j].sw_id);
		}
		for (let k = 0; k < tmp_path.length - 1; k++) {
			let key = tmp_path[k].toString() + "_" + tmp_path[k + 1].toString();
			let rev_key =
				tmp_path[k + 1].toString() + "_" + tmp_path[k].toString();

			// counter[key] = isNaN(counter[key]) ? isNaN(counter[rev_key]) ? : counter[key] + 1;
			if (isNaN(counter[key]) && isNaN(counter[rev_key])) {
				counter[key] = 1;

				if (counter[key] > max_val) {
					max_val = counter[key];
				}
			} else {
				if (isNaN(counter[key])) {
					counter[rev_key] = counter[rev_key] + 1;

					if (counter[rev_key] > max_val) {
						max_val = counter[rev_key];
					}
				} else {
					counter[key] = counter[key] + 1;

					if (counter[key] > max_val) {
						max_val = counter[key];
					}
				}
			}
		}
	}
	// console.log(counter);
	const scale = d3.scaleLinear().domain([min_val, max_val]).range([1, 10]);
	if (min_val == 0 && max_val == 0) {
		d3.selectAll("line.nodelink").style("stroke-width", 1);
	} else {
		for (const [key, value] of Object.entries(counter)) {
			const [source, target] = key.split("_");
			d3.select(
				`line.nodelink[source='${source}'][target='${target}']`
			).style("stroke-width", scale(value));
			// for bi directional link
			d3.select(
				`line.nodelink[source='${target}'][target='${source}']`
			).style("stroke-width", scale(value));
		}
	}
}
