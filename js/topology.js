import topo_data from "../topology.json" assert { type: "json" };

// set the dimensions and margins of the graph
const container_margin = 50;
const margin = { top: 50, right: 0, bottom: 25, left: 0 },
	width = d3.select("#topology").node().offsetWidth - container_margin,
	height = d3.select("#topology").node().offsetHeight;

// append the svg object to the body of the page
const full_svg = d3
	.select("#topology")
	.append("svg")
	.attr("width", width - margin.left - margin.right)
	.attr("height", height - margin.top - margin.bottom)
	.style("background-color", "#c9e8fd")
	.classed("svg-content", true);

const topo_svg = full_svg.append("g");
topo_svg.attr("transform", "translate(" + 0 + "," + 0 + ")");

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
	// d3.select(this).style("stroke", "none");
};

// const t1 = textures.lines().heavier().background("#faf9f6");
const t1 = textures
	.lines()
	.orientation("vertical", "horizontal")
	.size(6)
	.strokeWidth(1)
	.shapeRendering("crispEdges")
	.background("#faf9f6");
full_svg.call(t1);
const t2 = textures.lines().orientation("3/8", "7/8").background("#faf9f6");
full_svg.call(t2);
const t3 = textures.lines().size(4).background("#faf9f6");
full_svg.call(t3);
const t4 = textures
	.paths()
	.d("woven")
	.lighter()
	.thicker()
	.background("#faf9f6");
full_svg.call(t4);
const t5 = textures.circles().size(5).background("#faf9f6");
full_svg.call(t5);
const texture_list = [t1.url(), t2.url(), t3.url(), t4.url(), t5.url()];

// const sw_color_list = ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00"];

export function draw_topology(pckt_data) {
	let sw_names = [];
	for (let i = 0; i < topo_data.nodes.length; i++) {
		sw_names.push(topo_data.nodes[i].name);
	}

	const sw_texture =
		sw_names.length <= 5
			? texture_list.slice(0, sw_names.length)
			: [texture_list[0]];
	// color palette = one color per subgroup
	const texture_scale = d3
		.scaleOrdinal()
		.domain(sw_names.sort())
		.range(sw_texture);
	// console.log(sw_names, sw_color, topo_data.nodes);
	// const color_scale = d3.scaleOrdinal().domain(sw_names).range(d3.schemeSet1);

	var map = d3.json("../canada.geojson");

	// console.log(map, cities);
	map.then(function (values) {
		const projection = d3
			.geoMercator()
			.translate([
				(width - margin.left - margin.right) / 2,
				(height - margin.top - margin.bottom) / 2,
			])
			.scale(350)
			.center([-100, 60]);

		const path = d3.geoPath().projection(projection);
		const bounds = path.bounds(values);

		const zoom = d3
			.zoom()
			.scaleExtent([1, 10])
			.translateExtent([
				[bounds[0][0], bounds[0][1]],
				[bounds[1][0], bounds[1][1]],
			])
			.extent([
				[bounds[0][0], bounds[0][1]],
				[bounds[1][0], bounds[1][1]],
			])
			.on("zoom", zoomed);

		full_svg.call(zoom);

		function zoomed(event) {
			const { transform } = event;
			topo_svg.attr("transform", transform);
			topo_svg.attr("stroke-width", 1 / transform.k);
		}

		// console.log(bounds);
		// draw map
		topo_svg
			.selectAll("path")
			.data(values.features)
			.enter()
			.append("path")
			.attr("class", "province")
			.attr("d", path)
			.append("title")
			.text((d) => d.properties.name);

		// Initialize the links
		topo_svg
			.selectAll("line")
			.data(topo_data.links)
			.enter()
			.append("line")
			.attr("class", "nodelink")
			.attr("source", function (d) {
				return d.source;
			})
			.attr("target", function (d) {
				return d.target;
			})
			.attr("x1", (d) => {
				return projection([d.src_longitude, d.src_lattitude])[0];
			})
			.attr("x2", (d) => {
				return projection([d.target_longitude, d.target_lattitude])[0];
			})
			.attr("y1", (d) => {
				return projection([d.src_longitude, d.src_lattitude])[1];
			})
			.attr("y2", (d) => {
				return projection([d.target_longitude, d.target_lattitude])[1];
			})
			.style("stroke", "black")
			.style("stroke-width", 1);

		// draw points
		topo_svg
			.selectAll("circle")
			.data(topo_data.nodes)
			.enter()
			.append("circle")
			.attr("class", "nodes")
			.attr("cx", function (d) {
				return projection([d.longitude, d.lattitude])[0];
			})
			.attr("cy", function (d) {
				return projection([d.longitude, d.lattitude])[1];
			})
			.attr("r", "10")
			.attr("stroke", "black")
			.style("fill", function (d, i) {
				return texture_scale(d.name);
			})
			.on("mouseover", mouseover)
			.on("mousemove", mousemove)
			.on("mouseleave", mouseleave);

		update_link(pckt_data);
	});

	return topo_data.nodes;
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
	const scale = d3.scaleLinear().domain([min_val, max_val]).range([1, 8]);
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
