// set the dimensions and margins of the graph
const margin = {
	top: 50,
	right: 0,
	bottom: 30,
	left: 35,
};
const container_margin = 50; // pixel
const svg_width =
	d3.select("#bar").node().offsetWidth - container_margin > 0
		? d3.select("#bar").node().offsetWidth - container_margin
		: 400;
const svg_height =
	d3.select("#bar").node().offsetHeight - 50 > 0
		? d3.select("#bar").node().offsetHeight - 50
		: 400;

function avg_std(arr) {
	return [
		isNaN(d3.mean(arr)) ? 0 : d3.mean(arr),
		isNaN(d3.deviation(arr)) ? 0 : d3.deviation(arr),
	];
}
// preparing qdepth and duration data
const prepare_data = (data, nodes) => {
	let extracted_depth = {
		group: "Normalized queue depth",
	};
	let extracted_duration = {
		group: "Normalized packet duration",
	};
	let sw_names = [];
	for (let i = 0; i < nodes.length; i++) {
		extracted_depth[nodes[i].name] = [];
		extracted_duration[nodes[i].name] = [];
		sw_names.push(nodes[i].name);
	}

	// this function expects the name defined in topology.json in "Switch1" format
	// and the switch id in the data start from 0
	// switch id in the topology.json file also starts from 0
	for (let i = 0; i < data.length; i++) {
		const tmp_data = data[i];
		for (let j = 0; j < tmp_data.swtraces.length; j++) {
			extracted_depth[
				"Switch" + (tmp_data.swtraces[j].sw_id + 1).toString()
			].push(tmp_data.swtraces[j].qdepth);
			extracted_duration[
				"Switch" + (tmp_data.swtraces[j].sw_id + 1).toString()
			].push(tmp_data.swtraces[j].duration * 0.001); // converting microsecond to milli seconds
		}
	}
	let min_depth = [];
	let max_depth = [];
	let min_duration = [];
	let max_duration = [];
	for (let i = 0; i < nodes.length; i++) {
		const [avg_depth, std_depth] = avg_std(extracted_depth[nodes[i].name]);
		const [avg_duration, std_duration] = avg_std(
			extracted_duration[nodes[i].name]
		);

		min_depth.push(d3.min(extracted_depth[nodes[i].name]) - std_depth);
		max_depth.push(d3.max(extracted_depth[nodes[i].name]) + std_depth);

		min_duration.push(
			d3.min(extracted_duration[nodes[i].name]) - std_duration
		);
		max_duration.push(
			d3.max(extracted_duration[nodes[i].name]) + std_duration
		);

		extracted_depth[nodes[i].name] = isNaN(avg_depth) ? 0 : avg_depth;
		extracted_duration[nodes[i].name] = isNaN(avg_duration)
			? 0
			: avg_duration;

		extracted_depth[nodes[i].name + "_std"] = isNaN(std_depth)
			? 0
			: std_depth;
		extracted_duration[nodes[i].name + "_std"] = isNaN(std_duration)
			? 0
			: std_duration;
	}

	return [
		[extracted_depth, extracted_duration],
		isNaN(d3.min(min_depth)) ? 0 : d3.min(min_depth),
		isNaN(d3.max(max_depth)) ? 0 : d3.max(max_depth),
		isNaN(d3.min(min_duration)) ? 0 : d3.min(min_duration),
		isNaN(d3.max(max_duration)) ? 0 : d3.max(max_duration),
		sw_names,
	];
};

// append the svg object to the division for bar plot
const full_svg = d3
	.select("#bar")
	.append("svg")
	.attr("id", "bar_svg")
	.attr("width", svg_width)
	.attr("height", svg_height);

const bar_svg = full_svg
	.append("g")
	.attr("class", "bar_g")
	.attr("transform", "translate(" + 0 + "," + 0 + ")");

const grid = bar_svg
	.append("g")
	.attr("transform", `translate(${margin.left}, 0)`)
	.attr("class", "bar_g");
const yAxis = bar_svg
	.append("g")
	.attr("transform", `translate(${margin.left}, 0)`)
	.attr("class", "bar_g");
const xAxis = bar_svg
	.append("g")
	.attr("class", "bar_g")
	.attr("transform", "translate(0," + (svg_height - margin.bottom) + ")");

const t1 = textures
	.lines()
	.orientation("vertical", "horizontal")
	.size(6)
	.strokeWidth(1)
	.shapeRendering("crispEdges")
	.background("#faf9f6");
bar_svg.call(t1);
const t2 = textures.lines().orientation("3/8", "7/8").background("#faf9f6");
bar_svg.call(t2);
const t3 = textures.lines().size(4).background("#faf9f6");
bar_svg.call(t3);
const t4 = textures
	.paths()
	.d("woven")
	.lighter()
	.thicker()
	.background("#faf9f6");
bar_svg.call(t4);
const t5 = textures.circles().size(5).background("#faf9f6");
bar_svg.call(t5);
const bar_texture_list = [t1.url(), t2.url(), t3.url(), t4.url(), t5.url()];
// const bar_color_list = ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00"];

export function bar_plot(data, nodes) {
	d3.selectAll(".bar_rect").remove();
	d3.selectAll(".legend_element").remove();

	let [
		plot_data,
		min_depth,
		max_depth,
		min_duration,
		max_duration,
		subgroups,
	] = prepare_data(data, nodes);

	const groups = ["Normalized queue depth", "Normalized packet duration"];

	var x = d3
		.scaleBand()
		.domain(groups)
		.range([margin.left, svg_width - margin.right])
		.padding([0.2]);

	// Add Y axis
	// console.log(plot_data);
	const depth_scale = d3
		.scaleLinear()
		.domain([min_depth, max_depth])
		.range([svg_height - margin.bottom, margin.top]);

	const duration_scale = d3
		.scaleLinear()
		.domain([min_duration, max_duration])
		.range([svg_height - margin.bottom, margin.top]);

	var y = d3
		.scaleLinear()
		.domain([0, 1])
		.range([svg_height - margin.bottom, margin.top]);
	const yAxisGrid = d3
		.axisLeft(y)
		.tickSize(-(svg_width - margin.right))
		.tickFormat("")
		.ticks(5);

	grid.call(yAxisGrid);
	yAxis.call(
		d3
			.axisLeft(y)
			.tickSize(-(svg_width - margin.right))
			.ticks(5)
	);
	xAxis.call(d3.axisBottom(x).tickSize(0));

	// Another scale for subgroup position
	var xSubgroup = d3
		.scaleBand()
		.domain(subgroups)
		.range([0, x.bandwidth()])
		.padding([0.1]);

	const bar_texture =
		subgroups.length <= 5
			? bar_texture_list.slice(0, subgroups.length)
			: [bar_texture_list[0]];
	// color palette = one color per subgroup
	const texture_scale = d3
		.scaleOrdinal()
		.domain(subgroups.sort())
		.range(bar_texture);

	// const min_bar_height = 3; // pixels
	// Show the bars
	const u = bar_svg
		.append("g")
		.attr("class", "bar_g")
		.selectAll(".bar_g")
		// Enter in data = loop group per group
		.data(plot_data)
		.enter()
		.append("g")
		.attr("transform", function (d) {
			return "translate(" + x(d.group) + ",0)";
		})
		.selectAll("rect")
		.data(function (d) {
			return subgroups.map(function (key) {
				return {
					key: key,
					value: d[key],
					group: d["group"],
					std: d[key + "_std"],
				};
			});
		});

	if (
		min_depth == 0 &&
		max_depth == 0 &&
		min_duration == 0 &&
		max_duration == 0
	) {
		u.join("text")
			.attr("class", "legend_element")
			.attr("x", function (d, i) {
				return xSubgroup(d.key) + xSubgroup.bandwidth() / 2;
			})
			.attr("y", function (d) {
				return svg_height - margin.bottom - 5;
			})
			.style("fill", "black")
			.text(function (d) {
				return "0.0";
			})
			.style("text-anchor", "middle");
	} else {
		u.join("rect")
			.attr("class", "bar_rect")
			.attr("x", function (d) {
				return xSubgroup(d.key);
			})
			.attr("y", function (d, i) {
				if (d.group === "Normalized queue depth") {
					return depth_scale(d.value);
				} else {
					return duration_scale(d.value);
				}
			})
			.attr("width", xSubgroup.bandwidth())
			.attr("height", function (d) {
				if (d.group === "Normalized queue depth") {
					const ret_val =
						d.value == 0
							? 0
							: Math.max(
									0,
									svg_height -
										margin.bottom -
										depth_scale(d.value)
							  );
					return ret_val;
				} else {
					const ret_val =
						d.value == 0
							? 0
							: Math.max(
									0,
									svg_height -
										margin.bottom -
										duration_scale(d.value)
							  );

					return ret_val;
				}
			})
			.attr("fill", function (d) {
				return texture_scale(d.key);
			})
			.attr("stroke", "black")
			.attr("stroke-width", 2);

		u.join("line")
			.attr("class", "bar_rect")
			.attr("x1", function (d) {
				return xSubgroup(d.key) + xSubgroup.bandwidth() / 2;
			})
			.attr("x2", function (d) {
				return xSubgroup(d.key) + xSubgroup.bandwidth() / 2;
			})
			.attr("y1", function (d) {
				if (d.group == "Normalized queue depth") {
					return depth_scale(d.value - d.std);
				} else {
					return duration_scale(d.value - d.std);
				}
			})
			.attr("y2", function (d) {
				if (d.group == "Normalized queue depth") {
					return depth_scale(d.value + d.std);
				} else {
					return duration_scale(d.value + d.std);
				}
			})
			.style("stroke", "red")
			.style("stroke-width", 2);

		// adding legends on top of the bar
		// u.join("text")
		// 	// .data(plot_data)
		// 	.attr("class", "legend_element")
		// 	.attr("x", function (d, i) {
		// 		return xSubgroup(d.key) + xSubgroup.bandwidth() / 2;
		// 	})
		// 	.attr("y", function (d) {
		// 		// console.log(d);
		// 		if (d.group === "Normalized queue depth") {
		// 			return Math.min(
		// 				depth_scale(d.value) - 5,
		// 				svg_height - margin.bottom - 5
		// 			);
		// 		} else {
		// 			return Math.min(
		// 				duration_scale(d.value) - 5,
		// 				svg_height - margin.bottom - 5
		// 			);
		// 		}
		// 	})
		// 	.style("fill", "black")
		// 	.text(function (d) {
		// 		// console.log(d);
		// 		return d.key;
		// 	})
		// 	.style("text-anchor", "middle");
	}
	if (subgroups.length <= 5) {
		add_legends(subgroups, texture_scale);
	}
	return bar_svg;
}

function add_legends(subgroups, texture_scale) {
	const size = 20;
	// Add one dot in the legend for each name.
	full_svg
		.selectAll("#legend")
		.data(subgroups)
		.enter()
		.append("rect")
		.attr("class", "legend_element")
		.attr("x", function (d, i) {
			return margin.left + i * 120;
		})
		.attr("y", 10)
		.attr("width", size)
		.attr("height", size)
		.style("fill", function (d) {
			return texture_scale(d);
		})
		.style("stroke", "black")
		.style("stroke-width", 2);

	// Add one dot in the legend for each name.
	full_svg
		.selectAll("bar_labels")
		.data(subgroups)
		.enter()
		.append("text")
		.attr("class", "legend_element")
		.attr("x", function (d, i) {
			return margin.left + i * 120 + 25;
		})
		.attr("y", 30)
		.text(function (d) {
			return d;
		})
		.attr("font-size", "20");
}
