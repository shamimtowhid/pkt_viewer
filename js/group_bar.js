// set the dimensions and margins of the graph
const margin = {
	top: 50,
	right: 50,
	bottom: 100,
	left: 100,
};

const svg_width =
	d3.select("#bar").node().offsetWidth - margin.left - margin.right;
const svg_height =
	d3.select("#bar").node().offsetHeight - margin.top - margin.bottom;

const average = (arr) => arr.reduce((p, c) => p + c, 0) / (arr.length || 1);

// preparing qdepth and duration data
const prepare_data = (data, nodes) => {
	let extracted_depth = { group: "Normalized queue depth" };
	let extracted_duration = { group: "Normalized packet duration" };
	let sw_names = [];
	for (let i = 0; i < nodes.length; i++) {
		extracted_depth["sw_" + nodes[i].id.toString()] = [];
		extracted_duration["sw_" + nodes[i].id.toString()] = [];
		sw_names.push(nodes[i].name);
	}

	for (let i = 0; i < data.length; i++) {
		const tmp_data = data[i];
		for (let j = 0; j < tmp_data.swtraces.length; j++) {
			extracted_depth["sw_" + tmp_data.swtraces[j].sw_id.toString()].push(
				tmp_data.swtraces[j].qdepth
			);
			extracted_duration[
				"sw_" + tmp_data.swtraces[j].sw_id.toString()
			].push(tmp_data.swtraces[j].duration);
		}
	}
	let min_depth = [];
	let max_depth = [];
	let min_duration = [];
	let max_duration = [];
	for (let i = 0; i < nodes.length; i++) {
		const avg_depth = average(
			extracted_depth["sw_" + nodes[i].id.toString()]
		);

		const avg_duration =
			average(extracted_duration["sw_" + nodes[i].id.toString()]) * 0.001;

		min_depth.push(d3.min(extracted_depth["sw_" + nodes[i].id.toString()]));
		max_depth.push(d3.max(extracted_depth["sw_" + nodes[i].id.toString()]));

		min_duration.push(
			d3.min(extracted_duration["sw_" + nodes[i].id.toString()])
		);
		max_duration.push(
			d3.max(extracted_duration["sw_" + nodes[i].id.toString()])
		);

		extracted_depth["sw_" + nodes[i].id.toString()] = isNaN(avg_depth)
			? 0
			: avg_depth;

		extracted_duration["sw_" + nodes[i].id.toString()] = isNaN(avg_duration)
			? 0
			: avg_duration;
	}

	return [
		[extracted_depth, extracted_duration],
		isNaN(d3.min(min_depth)) ? 0 : d3.min(min_depth),
		isNaN(d3.max(max_depth)) ? 0 : d3.max(max_depth),
		isNaN(d3.min(min_duration)) ? 0 : d3.min(min_duration) * 0.001,
		isNaN(d3.max(max_duration)) ? 0 : d3.max(max_duration) * 0.001,
		sw_names,
	];
};

// append the svg object to the division for bar plot
const full_svg = d3
	.select("#bar")
	.append("svg")
	.attr("id", "bar_svg")
	.attr("width", svg_width + margin.left + margin.right)
	.attr("height", svg_height + margin.top + margin.bottom);

const bar_svg = full_svg
	.append("g")
	.attr("class", "bar_g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

const grid = bar_svg.append("g").attr("class", "bar_g");
const yAxis = bar_svg.append("g").attr("class", "bar_g");
const xAxis = bar_svg
	.append("g")
	.attr("class", "bar_g")
	.attr("transform", "translate(0," + svg_height + ")");

// Add x-axis label
// full_svg
// 	.append("text")
// 	.attr("text-anchor", "middle")
// 	.attr("font-size", "20px")
// 	// .attr("style", "font-weight: bold")
// 	.attr("x", (svg_width + margin.left + margin.right) / 2)
// 	.attr("y", svg_height + margin.top + margin.bottom - 15)
// 	.text("Router Information")
// 	.style("fill", "grey");

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

	// console.log(plot_data);
	// console.log(min_depth);
	// console.log(max_depth);
	// console.log(min_duration);
	// console.log(max_duration);
	// console.log(subgroups);

	const groups = ["Normalized queue depth", "Normalized packet duration"];

	var x = d3.scaleBand().domain(groups).range([0, svg_width]).padding([0.2]);

	// Add Y axis
	const depth_scale = d3
		.scaleLinear()
		.domain([min_depth, max_depth])
		.range([svg_height, 0]);

	const duration_scale = d3
		.scaleLinear()
		.domain([min_duration, max_duration])
		.range([svg_height, 0]);

	var y = d3.scaleLinear().domain([0, 1]).range([svg_height, 0]);
	const yAxisGrid = d3
		.axisLeft(y)
		.tickSize(-svg_width)
		.tickFormat("")
		.ticks(5);

	grid.call(yAxisGrid);
	yAxis.call(d3.axisLeft(y).tickSize(-svg_width).ticks(5));
	xAxis.call(d3.axisBottom(x).tickSize(0));

	// Another scale for subgroup position
	var xSubgroup = d3
		.scaleBand()
		.domain(subgroups)
		.range([0, x.bandwidth()])
		.padding([0.05]);

	// color palette = one color per subgroup
	var color = d3.scaleOrdinal().domain(subgroups).range(d3.schemeSet1);

	const min_bar_height = 3; // pixels
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
				return { key: key, value: d[key], group: d["group"] };
			});
		});

	if (min_depth == 0 && max_depth == 0) {
		u.join("rect")
			//.append("rect")
			.attr("class", "bar_rect")
			//.merge(u)
			.attr("x", function (d) {
				return xSubgroup(d.key);
			})
			.attr("y", svg_height - min_bar_height)
			.attr("width", xSubgroup.bandwidth())
			//.transition()
			//.duration(500)
			.attr("height", min_bar_height)
			.attr("fill", function (d) {
				return color(d.key);
			});
	} else {
		u.join("rect")
			//.append("rect")
			.attr("class", "bar_rect")
			//.merge(u)
			.attr("x", function (d) {
				return xSubgroup(d.key);
			})
			.attr("y", function (d) {
				if (d.group === "Normalized queue depth") {
					return Math.min(
						svg_height - min_bar_height,
						depth_scale(d.value)
					);
				} else {
					return Math.min(
						svg_height - min_bar_height,
						duration_scale(d.value)
					);
				}
			})
			.attr("width", xSubgroup.bandwidth())
			//.transition()
			//.duration(500)
			.attr("height", function (d) {
				if (d.group === "Normalized queue depth") {
					return Math.max(
						min_bar_height,
						svg_height - depth_scale(d.value)
					);
				} else {
					return Math.max(
						min_bar_height,
						svg_height - duration_scale(d.value)
					);
				}
			})
			.attr("fill", function (d) {
				return color(d.key);
			});
	}

	add_legends(subgroups, color);

	return bar_svg;
}

function add_legends(subgroups, color) {
	const size = 20;
	// Add one dot in the legend for each name.
	full_svg
		.selectAll("#legend")
		.data(subgroups)
		.enter()
		.append("rect")
		.attr("class", "legend_element")
		.attr("x", function (d, i) {
			return margin.left + i * 100;
		})
		.attr("y", 5)
		.attr("width", size)
		.attr("height", size)
		.style("fill", function (d) {
			return color(d);
		});

	// Add one dot in the legend for each name.
	full_svg
		.selectAll("bar_labels")
		.data(subgroups)
		.enter()
		.append("text")
		.attr("class", "legend_element")
		.attr("x", function (d, i) {
			return margin.left + i * 100 + 25;
		})
		.attr("y", 15)
		.style("fill", function (d) {
			return color(d);
		})
		.text(function (d) {
			return d;
		})
		.attr("text-anchor", "left")
		.attr("font-size", "20px")
		.style("alignment-baseline", "middle");
}
