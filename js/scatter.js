const scatter_height = d3.select("#scatter").node().offsetHeight; //-
//d3.select("#label_h1").node().offsetHeight;

const scatter_width = d3.select("#scatter").node().offsetWidth;

const unique_dst_ip = new Set();

// preparing X data
const xValue = (d) => {
	// const ts1 = 1675921681.915128;
	unique_dst_ip.add(d.dst_ip);

	if (d.send_time === ts1) {
		return 1;
	} else {
		return d.send_time - ts1; // return difference between two timestamp in seconds
	}
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

const scatter_margin = {
	top: 50,
	right: 50,
	bottom: 100,
	left: 100,
};
const radius = 3;
let ts1, ts2;
const color_list = ["#1b9e77", "#d95f02", "#7570b3"];

export function scatter_plot(parsedData) {
	ts1 = parsedData[0].send_time;
	ts2 = parsedData[parsedData.length - 1].send_time;
	const x = d3
		.scaleLinear()
		.domain(d3.extent(parsedData, xValue))
		.range([scatter_margin.left, scatter_width - scatter_margin.right])
		.nice();

	// acts as a setter if we provide a value
	// if we do not provide a value like below, it acts as a getter
	//console.log(x.domain());
	//console.log(x.range());

	const y = d3
		.scaleLinear()
		.domain(d3.extent(parsedData, yValue))
		.range([scatter_height - scatter_margin.bottom, scatter_margin.top]) // this range is flipped because origin is at upper left corner
		.nice();

	const marks = parsedData.map((d) => ({
		x: x(xValue(d)),
		y: y(yValue(d)),
		// color: color_scale(dstIP(d)),
		destination_ip: dstIP(d),
		source_ip: srcIP(d),
		size_in_bytes: pktSize(d),
		swtraces: swtrace(d),
		//label: `Source IP: ${srcIP(d)}\nDestination IP: ${dstIP(
		//	d
		//)}\nSize: ${pktSize(d)} bytes`,
	}));

	const color_values =
		unique_dst_ip.size <= 3
			? color_list.slice(0, unique_dst_ip.size)
			: [color_list[0]];

	const color_scale = d3
		.scaleOrdinal()
		.domain(d3.extent(parsedData, dstIP))
		.range(color_values); // color is selected by using colorbrewer2

	const scatter_svg = d3
		.select("#scatter")
		.append("svg")
		.attr("width", scatter_width)
		.attr("height", scatter_height);

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
	scatter_svg
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
		.attr("y", 20)
		.attr("transform", "rotate(-90)")
		.text("Queue Depth (avg.)")
		.style("fill", "grey");

	scatter_svg
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
		.attr("y", scatter_height - 15)
		.text("Time (second)")
		.style("fill", "grey");

	// Create the range slider

	// calculate brushable area
	const brushArea = [
		[scatter_margin.left - 10, scatter_margin.top - 10],
		[
			scatter_width - (scatter_margin.right - 10),
			scatter_height - (scatter_margin.bottom - 10),
		],
	];

	// add legends with checkbox
	if (unique_dst_ip.size <= 3) {
		addLegend(scatter_svg, color_scale);
	}

	// add human readbale date and time
	const date_text =
		"From: " +
		new Date(ts1 * 1000).toLocaleString() +
		"\tTo: " +
		new Date(ts2 * 1000).toLocaleString();
	scatter_svg
		.append("text")
		.attr("class", "larger")
		.attr("x", scatter_margin.left + 3 * 100 + 50)
		.attr("y", 25)
		.text(date_text)
		.attr("font-size", "20");

	return [scatter_svg, circles, brushArea, color_scale];
}

function addLegend(scatter_svg, color_scale) {
	// console.log(nodes);
	// create legends with checkbox
	const host_list = Array.from(unique_dst_ip).sort();
	for (let i = 0; i < host_list.length; i++) {
		let label = "Host" + (i + 1).toString();

		scatter_svg
			.append("foreignObject")
			.attr("class", "checkbox")
			.attr("x", scatter_margin.left + i * 100)
			.attr("y", 5)
			.attr("width", 30)
			.attr("height", 30)
			.style("accent-color", color_scale(host_list[i]))
			.html(
				`<input name='host' class='larger' value=${host_list[i]} type='checkbox' checked >`
			);

		scatter_svg
			.append("text")
			.attr("class", "larger")
			.attr("x", scatter_margin.left + i * 100 + 30)
			.attr("y", 25)
			.text(label)
			.attr("fill", color_scale(host_list[i]))
			.attr("font-size", "20");
	}
}
