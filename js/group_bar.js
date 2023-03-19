// set the dimensions and margins of the graph
const margin = {
	top: d3.select("#label_h1").node().offsetHeight + 10,
	right: 30,
	bottom: 20,
	left: 50,
};

const svg_width =
	d3.select("#bar").node().offsetWidth - margin.left - margin.right;
const svg_height =
	d3.select("#bar").node().offsetHeight - margin.top - margin.bottom;

const average = (arr) => arr.reduce((p, c) => p + c, 0) / arr.length;

// preparing qdepth and duration data
const preapre_data = (data) => {
	let s1_depth = [];
	let s2_depth = [];
	let s3_depth = [];
	let s1_duration = [];
	let s2_duration = [];
	let s3_duration = [];
	// let min_depth = 100; // highest possible value is 63
	// let max_depth = -1; // lowest possible value is 0
	// let min_duration = 99999999; //highest possible value is 2707270
	// let max_duration = 0; // lowest possible value is 116

	for (let i = 0; i < data.length; i++) {
		const tmp_data = data[i];
		for (let j = 0; j < tmp_data.swtraces.length; j++) {
			if (tmp_data.swtraces[j].sw_id === 0) {
				s1_depth.push(tmp_data.swtraces[j].qdepth);
				s1_duration.push(tmp_data.swtraces[j].duration);
			} else if (tmp_data.swtraces[j].sw_id === 1) {
				s2_depth.push(tmp_data.swtraces[j].qdepth);
				s2_duration.push(tmp_data.swtraces[j].duration);
			} else {
				s3_depth.push(tmp_data.swtraces[j].qdepth);
				s3_duration.push(tmp_data.swtraces[j].duration);
			}
		}
	}
	return [
		average(s1_depth),
		average(s2_depth),
		average(s3_depth),
		d3.min([d3.min(s1_depth), d3.min(s2_depth), d3.min(s3_depth)]),
		d3.max([d3.max(s1_depth), d3.max(s2_depth), d3.max(s3_depth)]),
		average(s1_duration) * 0.001,
		average(s2_duration) * 0.001,
		average(s3_duration) * 0.001,
		d3.min([
			d3.min(s1_duration),
			d3.min(s2_duration),
			d3.min(s3_duration),
		]) * 0.001,
		d3.max([
			d3.max(s1_duration),
			d3.max(s2_duration),
			d3.max(s3_duration),
		]) * 0.001,
	];
};

// preparing duration data
// const duration = (data) => {
// 	let s1_duration = [];
// 	let s2_duration = [];
// 	let s3_duration = [];

// 	for (let i = 0; i < data.swtraces.length; i++) {
// 		if (data.swtraces[i].sw_id === 0) {
// 			s1_duration.push(data.swtraces[i].duration);
// 		} else if (data.swtraces[i].sw_id === 1) {
// 			s2_duration.push(data.swtraces[i].duration);
// 		} else {
// 			s3_duration.push(data.swtraces[i].duration);
// 		}
// 	}
// 	//converting to millisecond
// 	return [
// 		average(s1_duration) * 0.001,
// 		average(s2_duration) * 0.001,
// 		average(s3_duration) * 0.001,
// 	];
// };

export function bar_plot(data) {
	// append the svg object to the division for bar plot
	const bar_svg = d3
		.select("#bar")
		.append("svg")
		.attr("width", svg_width + margin.left + margin.right)
		.attr("height", svg_height + margin.top + margin.bottom)
		.append("g")
		.attr("class", "bar_g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	const [
		s1_qdepth,
		s2_qdepth,
		s3_qdepth,
		min_depth,
		max_depth,
		s1_duration,
		s2_duration,
		s3_duration,
		min_duration,
		max_duration,
	] = preapre_data(data);

	const plot_data = [
		{
			group: "Normalized queue depth",
			s1: s1_qdepth,
			s2: s2_qdepth,
			s3: s3_qdepth,
		},
		{
			group: "Normalized packet duration",
			s1: s1_duration,
			s2: s2_duration,
			s3: s3_duration,
		},
	];
	//console.log(plot_data);
	const subgroups = ["s1", "s2", "s3"];
	const groups = ["Normalized queue depth", "Normalized packet duration"];
	// const groups = d3
	// 	.map(plot_data, function (d) {
	// 		return d.group;
	// 	})
	// 	.keys();
	// Add X axis

	var x = d3.scaleBand().domain(groups).range([0, svg_width]).padding([0.2]);

	bar_svg
		.append("g")
		.attr("class", "bar_g")
		.attr("transform", "translate(0," + svg_height + ")")
		.call(d3.axisBottom(x).tickSize(0));

	// Add Y axis
	const depth_scale = d3
		.scaleLinear()
		.domain([min_depth, max_depth])
		.range([svg_height, 0]);

	const duration_scale = d3
		.scaleLinear()
		.domain([min_depth, max_duration])
		.range([svg_height, 0]);

	var y = d3.scaleLinear().domain([0, 1]).range([svg_height, 0]);

	bar_svg.append("g").attr("class", "bar_g").call(d3.axisLeft(y));

	// Another scale for subgroup position
	var xSubgroup = d3
		.scaleBand()
		.domain(subgroups)
		.range([0, x.bandwidth()])
		.padding([0.05]);

	// color palette = one color per subgroup
	var color = d3
		.scaleOrdinal()
		.domain(subgroups)
		.range(["#e41a1c", "#377eb8", "#4daf4a"]);

	const min_bar_height = 3;
	// Show the bars
	bar_svg
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
		})
		.enter()
		.append("rect")
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

	return bar_svg;
}
