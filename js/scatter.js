import topo_data from "../topology.json" assert { type: "json" };
import { bar_plot } from "./group_bar.js";
import { update_link } from "./topology.js";

const scatter_height = d3.select("#scatter").node().offsetHeight - 30; //-
const container_margin = 50;
const scatter_width =
	d3.select("#scatter").node().offsetWidth - container_margin;

const unique_dst_ip = new Set();

// preparing X data
const xValue = (d) => {
	unique_dst_ip.add(d.dst_ip);

	return d.send_time - ts1; // return difference between two timestamp in seconds
};

// preparing Y data
const yValue = (d) => {
	let depth = 0;
	for (let i = 0; i < d.swtraces.length; i++) {
		depth = depth + d.swtraces[i].qdepth;
	}
	return depth / d.swtraces.length;
};

const srcIP = (d) => d.src_ip;
const dstIP = (d) => d.dst_ip;
const pktSize = (d) => d.pkt_size_byte;
const swtrace = (d) => d.swtraces;
const sendTime = (d) => d.send_time;

const scatter_margin = {
	top: 50,
	right: 80,
	bottom: 100,
	left: 80,
};
const radius = 5;
let ts1, ts2;
const color_list = ["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854"];

export function scatter_plot(parsedData) {
	ts1 = parsedData[0].send_time;
	ts2 = parsedData[parsedData.length - 1].send_time;

	const [xmin, xmax] = d3.extent(parsedData, xValue);
	const [ymin, ymax] = d3.extent(parsedData, yValue);

	const x = d3
		.scaleLinear()
		.domain([xmin, xmax])
		.range([scatter_margin.left, scatter_width - scatter_margin.right])
		.nice()
		.clamp(true);

	// acts as a setter if we provide a value
	// if we do not provide a value like below, it acts as a getter
	//console.log(x.domain());
	//console.log(x.range());
	// console.log(ymin, ymax);
	const y = d3
		.scaleLinear()
		.domain([ymin, ymax])
		.range([scatter_height - scatter_margin.bottom, scatter_margin.top]) // this range is flipped because origin is at upper left corner
		.nice()
		.clamp(true);

	const marks = parsedData.map((d) => ({
		x: x(xValue(d)),
		y: y(yValue(d)),
		destination_ip: dstIP(d),
		source_ip: srcIP(d),
		size_in_bytes: pktSize(d),
		swtraces: swtrace(d),
		raw_x: xValue(d),
		raw_y: yValue(d),
		send_time: sendTime(d),
	}));

	const color_values =
		unique_dst_ip.size <= 5
			? color_list.slice(0, unique_dst_ip.size)
			: [color_list[0]];

	const color_scale = d3
		.scaleOrdinal()
		.domain(d3.extent(parsedData, dstIP).sort())
		.range(color_values); // color is selected by using colorbrewer2

	const scatter_svg = d3
		.select("#scatter")
		.append("svg")
		.attr("width", scatter_width)
		.attr("height", scatter_height);

	// calculate brushable area
	const brushArea = [
		[scatter_margin.left - 5, scatter_margin.top - 5],
		[
			scatter_width - (scatter_margin.right - 5),
			scatter_height - (scatter_margin.bottom - 5),
		],
	];
	const circles = scatter_svg
		.selectAll(".dot")
		.data(marks)
		.join("circle")
		.attr("class", "dot")
		.attr("cx", (d) => d.x)
		.attr("cy", (d) => d.y)
		.attr("r", radius)
		.attr("display", "inline")
		.style("fill", (d) => color_scale(d.destination_ip));

	// adding the X and Y axis
	const yAxis = scatter_svg
		.append("g")
		.attr("class", "y_axis")
		.attr("transform", `translate(${scatter_margin.left}, 0)`)
		.call(d3.axisLeft(y));

	// Add y-axis label
	scatter_svg
		.append("text")
		.attr("class", "y label")
		.attr("text-anchor", "middle")
		.attr("font-size", "20px")
		// .attr("style", "font-weight: bold")
		.attr("x", -scatter_height / 2 + 30)
		.attr("y", 35)
		.attr("transform", "rotate(-90)")
		.text("Queue Depth (avg.)")
		.style("fill", "#000");

	const xAxis = scatter_svg
		.append("g")
		.attr("class", "x_axis")
		.attr(
			"transform",
			`translate(0, ${scatter_height - scatter_margin.bottom})`
		)
		.call(d3.axisBottom(x));

	// Add x-axis label
	scatter_svg
		.append("text")
		.attr("class", "x label")
		.attr("text-anchor", "middle")
		.attr("font-size", "20px")
		// .attr("style", "font-weight: bold")
		.attr("x", scatter_width / 2)
		.attr("y", scatter_height - 10)
		.text("Time (second)")
		.style("fill", "#000");

	// Create the range slider
	add_slider_x(
		[xmin, xmax],
		scatter_svg,
		x,
		xAxis,
		circles,
		color_scale,
		brushArea
	);

	add_slider_y(
		[ymin, ymax],
		scatter_svg,
		y,
		yAxis,
		circles,
		color_scale,
		brushArea
	);

	// add legends with checkbox
	if (unique_dst_ip.size <= 5) {
		addLegend(scatter_svg, color_scale);
	}

	// add human readbale date and time
	const date_text =
		"Total " +
		parsedData.length.toString() +
		" packets collected from " +
		new Date(ts1 * 1000).toLocaleString() +
		" to " +
		new Date(ts2 * 1000).toLocaleString();

	d3.select("#timeline").html(date_text);

	return [scatter_svg, circles, brushArea, color_scale];
}

function addLegend(scatter_svg, color_scale) {
	// create legends with checkbox
	const host_list = Array.from(unique_dst_ip).sort();
	for (let i = 0; i < host_list.length; i++) {
		let label = "Host" + (i + 1).toString();

		scatter_svg
			.append("foreignObject")
			.attr("class", "checkbox")
			.attr("x", scatter_margin.left + i * 100)
			.attr("y", 15)
			.attr("width", 30)
			.attr("height", 30)
			.style("accent-color", color_scale(host_list[i]))
			// .style("stroke", "white")
			.html(
				`<input name='host' class='check' value=${host_list[i]} type='checkbox' checked >`
			);

		scatter_svg
			.append("text")
			.attr("class", "larger")
			.attr("x", scatter_margin.left + i * 100 + 30)
			.attr("y", 35)
			.text(label)
			.attr("fill", color_scale(host_list[i]))
			.attr("font-size", "20");
	}
}

function add_slider_x(sliderVals, svg, x, xAxis, circles, color_scale, area) {
	const xMin = x.range()[0];
	const xMax = x.range()[1];

	const slider = svg
		.append("g")
		.attr("class", "slider")
		.attr("transform", `translate(0, ${scatter_height - 55})`);

	slider
		.append("line")
		.attr("class", "track")
		.attr("x1", 10 + x.range()[0])
		.attr("x2", 10 + x.range()[1]);

	const selRange = slider
		.append("line")
		.attr("class", "sel-range")
		.attr("x1", 10 + x(sliderVals[0]))
		.attr("x2", 10 + x(sliderVals[1]));

	slider
		.selectAll(".sliderhandle")
		.data([0, 1])
		.enter()
		.append("rect", ".track-overlay")
		.attr("class", "sliderhandle")
		.attr("y", -8)
		.attr("x", (d) => x(sliderVals[d]))
		.attr("rx", 3)
		.attr("height", 16)
		.attr("width", 20)
		.call(
			d3.drag().on("start", startDrag).on("drag", drag).on("end", endDrag)
		);

	function startDrag() {
		d3.select(this).raise().classed("active", true);
	}

	function drag(event, d) {
		let x1 = event.x;
		if (x1 > xMax) {
			x1 = xMax;
		} else if (x1 < xMin) {
			x1 = xMin;
		}
		d3.select(this).attr("x", x1);
		const x2 = x(sliderVals[d == 0 ? 1 : 0]);
		selRange.attr("x1", 10 + x1).attr("x2", 10 + x2);

		d3.selectAll(".handle_tip").remove();

		slider
			.append("text")
			.attr("class", "handle_tip")
			.text(Math.round(x.invert(x1)))
			.attr("x", 10 + x1)
			.attr("y", 25)
			.style("fill", "#000")
			.style("text-anchor", "middle");

		slider
			.append("text")
			.attr("class", "handle_tip")
			.text(Math.round(x.invert(x2)))
			.attr("x", 10 + x2)
			.attr("y", 25)
			.style("fill", "#000")
			.style("text-anchor", "middle");

		// for real time updating the plot (The brushing is not so smooth in this case, commenting out)

		// let v = x.invert(event.x);
		// const elem = d3.select(this);
		// let past_position = sliderVals[d];
		// sliderVals[d] = v;
		// let v1 = Math.round(Math.min(sliderVals[0], sliderVals[1])),
		// 	v2 = Math.round(Math.max(sliderVals[0], sliderVals[1]));

		// if (x(v2 - v1) < x(min_distance)) {
		// 	if (past_position > v) {
		// 		v = Math.min(
		// 			x.domain()[1],
		// 			sliderVals[d == 0 ? 1 : 0] + x(min_distance)
		// 		);
		// 	} else {
		// 		v = Math.max(
		// 			x.domain()[0],
		// 			sliderVals[d == 0 ? 1 : 0] - x(min_distance)
		// 		);
		// 	}
		// }

		// sliderVals[d] = v;
		// v1 = Math.round(Math.min(sliderVals[0], sliderVals[1]));
		// v2 = Math.round(Math.max(sliderVals[0], sliderVals[1]));

		// elem.classed("active", false).attr("x", x(v));
		// selRange.attr("x1", 10 + x(v1)).attr("x2", 10 + x(v2));
		// // console.log(selRange.attr("x1"));
		// // console.log(selRange.attr("x2"));
		// // console.log(v1, v2);
		// updatePlot(svg, [v1, v2], x, xAxis, circles, color_scale, area);
	}

	const min_distance = 100; //seconds
	function endDrag(event, d) {
		// invert function converts range value to domain value
		// console.log(x.domain());
		let v = x.invert(event.x);
		const elem = d3.select(this);
		let past_position = sliderVals[d];
		sliderVals[d] = v;
		let v1 = Math.round(Math.min(sliderVals[0], sliderVals[1])),
			v2 = Math.round(Math.max(sliderVals[0], sliderVals[1]));

		if (v2 - v1 < min_distance) {
			if (past_position > v) {
				v = Math.min(
					x.domain()[1],
					sliderVals[d == 0 ? 1 : 0] + min_distance
				);
			} else {
				v = Math.max(
					x.domain()[0],
					sliderVals[d == 0 ? 1 : 0] - min_distance
				);
			}
		}

		sliderVals[d] = v;
		v1 = Math.round(Math.min(sliderVals[0], sliderVals[1]));
		v2 = Math.round(Math.max(sliderVals[0], sliderVals[1]));

		elem.classed("active", false).attr("x", x(v));
		selRange.attr("x1", 10 + x(v1)).attr("x2", 10 + x(v2));

		d3.selectAll(".handle_tip").remove();
		slider
			.append("text")
			.attr("class", "handle_tip")
			.text(Math.round(v1))
			.attr("x", 10 + x(v1))
			.attr("y", 25)
			.style("fill", "#000")
			.style("text-anchor", "middle")
			.transition()
			.duration(1000)
			.remove();

		slider
			.append("text")
			.attr("class", "handle_tip")
			.text(Math.round(v2))
			.attr("x", 10 + x(v2))
			.attr("y", 25)
			.style("fill", "#000")
			.style("text-anchor", "middle")
			.transition()
			.duration(1000)
			.remove();

		// console.log(selRange.attr("x1"));
		// console.log(selRange.attr("x2"));
		// console.log(v1, v2);
		updatePlot([v1, v2], xAxis, circles, color_scale, area);
	}
}

// A function that update the plot for a given range on X axis
function updatePlot(slider_range, xAxis, circles, color_scale, area) {
	d3.selectAll("#added_table").remove();
	d3.selectAll("#large_circle").remove();
	d3.select("#table_msg").text("No packet is selected");
	d3.select("#brush").call(d3.brush().move, null);
	d3.selectAll(".dot")
		.style("fill", (d) => color_scale(d.destination_ip))
		.style("stroke-width", 0.5);
	// slider range
	const xmin = slider_range[0];
	const xmax = slider_range[1];

	// Update X axis
	const x_scale = d3
		.scaleLinear()
		.domain([xmin, xmax])
		.range([scatter_margin.left, scatter_width - scatter_margin.right]);
	// .nice(); // nice in this place is not a good idea

	// console.log(x_scale.domain());
	xAxis.transition().duration(500).call(d3.axisBottom(x_scale));

	// for (let i = 0; i < circles.data().length; i++) {
	// 	circles.data()[i].x = x_scale(circles.data()[i].raw_x);
	// }
	let visible_circle = [];
	// Update chart
	circles
		.filter(function () {
			// console.log(d3.select(this).data()[0].x);
			const new_x = x_scale(d3.select(this).data()[0].raw_x);
			const new_y = d3.select(this).data()[0].y;
			d3.select(this).data()[0].x = new_x;

			if (
				new_x < area[0][0] ||
				new_x > area[1][0] ||
				new_y < area[0][1] ||
				new_y > area[1][1]
			) {
				d3.select(this).attr("display", "none");
			} else {
				let ip = d3.select(this).data()[0].destination_ip;
				let checkbox = d3.select(
					`input[type="checkbox"][value="${ip}"]`
				);
				if (checkbox.property("checked")) {
					d3.select(this).attr("display", "inline");
					visible_circle.push(d3.select(this).data()[0]);
				}
			}
			return d3.select(this);
		})
		.transition()
		.duration(500)
		.attr("cx", function (d) {
			return d.x;
		});
	bar_plot(visible_circle, topo_data.nodes);
	update_link(visible_circle);
}

function add_slider_y(sliderVals, svg, y, yAxis, circles, color_scale, area) {
	const yMin = y.range()[0];
	const yMax = y.range()[1];

	const slider = svg
		.append("g")
		.attr("class", "slider")
		.attr("transform", `translate(${scatter_width - 40}, 0)`);

	slider
		.append("line")
		.attr("class", "track")
		.attr("y1", 8 + y.range()[0])
		.attr("y2", 8 + y.range()[1]);

	const selRange = slider
		.append("line")
		.attr("class", "sel-range")
		.attr("y1", 8 + y(sliderVals[0]))
		.attr("y2", 8 + y(sliderVals[1]));

	slider
		.selectAll(".sliderhandle")
		.data([0, 1])
		.enter()
		.append("rect", ".track-overlay")
		.attr("class", "sliderhandle")
		.attr("y", (d) => y(sliderVals[d]))
		.attr("x", -10)
		.attr("rx", 3)
		.attr("height", 16)
		.attr("width", 20)
		.call(
			d3.drag().on("start", startDrag).on("drag", drag).on("end", endDrag)
		);

	function startDrag() {
		d3.select(this).raise().classed("active", true);
	}

	function drag(event, d) {
		// console.log(d);
		let y1 = event.y;
		if (y1 > yMin) {
			y1 = yMin;
		} else if (y1 < yMax) {
			y1 = yMax;
		}
		// console.log(yMax, yMin, y1);
		d3.select(this).attr("y", y1);
		const y2 = y(sliderVals[d == 0 ? 1 : 0]);
		selRange.attr("y1", 8 + y1).attr("y2", 8 + y2);

		d3.selectAll(".handle_tip").remove();

		slider
			.append("text")
			.attr("class", "handle_tip")
			.text(Math.round(y.invert(y1)))
			.attr("x", 21)
			.attr("y", 13 + y1)
			.style("fill", "#000")
			.style("text-anchor", "middle");

		slider
			.append("text")
			.attr("class", "handle_tip")
			.text(Math.round(y.invert(y2)))
			.attr("x", 21)
			.attr("y", 13 + y2)
			.style("fill", "#000")
			.style("text-anchor", "middle");
	}

	const min_distance = 8; // avg. qdepth
	function endDrag(event, d) {
		// invert function converts range value to domain value
		// console.log(x.domain());
		let v = y.invert(event.y);
		const elem = d3.select(this);
		let past_position = sliderVals[d];
		sliderVals[d] = v;
		let v1 = Math.round(Math.min(sliderVals[0], sliderVals[1])),
			v2 = Math.round(Math.max(sliderVals[0], sliderVals[1]));
		// console.log(min_distance);
		if (v2 - v1 < min_distance) {
			if (past_position > v) {
				v = Math.min(
					y.domain()[1],
					sliderVals[d == 0 ? 1 : 0] + min_distance
				);
			} else {
				v = Math.max(
					y.domain()[0],
					sliderVals[d == 0 ? 1 : 0] - min_distance
				);
			}
		}

		sliderVals[d] = v;
		v1 = Math.round(Math.min(sliderVals[0], sliderVals[1]));
		v2 = Math.round(Math.max(sliderVals[0], sliderVals[1]));

		elem.classed("active", false).attr("y", y(v));
		selRange.attr("y1", 8 + y(v1)).attr("y2", 8 + y(v2));

		d3.selectAll(".handle_tip").remove();
		slider
			.append("text")
			.attr("class", "handle_tip")
			.text(Math.round(v1))
			.attr("x", 21)
			.attr("y", 13 + y(v1))
			.style("fill", "#000")
			.style("text-anchor", "middle")
			.transition()
			.duration(1000)
			.remove();

		slider
			.append("text")
			.attr("class", "handle_tip")
			.text(Math.round(v2))
			.attr("x", 21)
			.attr("y", 13 + y(v2))
			.style("fill", "#000")
			.style("text-anchor", "middle")
			.transition()
			.duration(1000)
			.remove();

		// console.log(selRange.attr("x1"));
		// console.log(selRange.attr("x2"));
		// console.log(v1, v2);
		updatePlot_y([v1, v2], yAxis, circles, color_scale, area);
	}
}

// A function that update the plot for a given range on Y axis
function updatePlot_y(slider_range, yAxis, circles, color_scale, area) {
	d3.selectAll("#added_table").remove();
	d3.selectAll("#large_circle").remove();
	d3.select("#table_msg").text("No packet is selected");
	d3.select("#brush").call(d3.brush().move, null);
	d3.selectAll(".dot")
		.style("fill", (d) => color_scale(d.destination_ip))
		.style("stroke-width", 0.5);
	// slider range
	const ymin = slider_range[0];
	const ymax = slider_range[1];
	// console.log(ymin, ymax);
	// Update Y axis
	const y_scale = d3
		.scaleLinear()
		.domain([ymin, ymax])
		.range([scatter_height - scatter_margin.bottom, scatter_margin.top]); // this range is flipped because origin is at upper left corner
	// .nice(); // nice in this place is not a good idea

	// console.log(x_scale.domain());
	yAxis.transition().duration(500).call(d3.axisLeft(y_scale));

	// for (let i = 0; i < circles.data().length; i++) {
	// 	circles.data()[i].x = x_scale(circles.data()[i].raw_x);
	// }
	let visible_circle = [];
	// Update chart
	circles
		.filter(function () {
			// console.log(d3.select(this).data()[0].x);
			const new_y = y_scale(d3.select(this).data()[0].raw_y);
			const new_x = d3.select(this).data()[0].x;
			d3.select(this).data()[0].y = new_y;

			if (
				new_y < area[0][1] ||
				new_y > area[1][1] ||
				new_x < area[0][0] ||
				new_x > area[1][0]
			) {
				d3.select(this).attr("display", "none");
			} else {
				let ip = d3.select(this).data()[0].destination_ip;
				let checkbox = d3.select(
					`input[type="checkbox"][value="${ip}"]`
				);
				if (checkbox.property("checked")) {
					d3.select(this).attr("display", "inline");
					visible_circle.push(d3.select(this).data()[0]);
				}
			}
			// console.log(d3.select(this).data()[0].x);
			return d3.select(this);
		})
		.transition()
		.duration(500)
		.attr("cy", function (d) {
			return d.y;
		});
	bar_plot(visible_circle, topo_data.nodes);
	update_link(visible_circle);
}
