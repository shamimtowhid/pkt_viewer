const scatter_height =
	d3.select("#scatter").node().offsetHeight -
	d3.select("#label_h1").node().offsetHeight;

const scatter_width = d3.select("#scatter").node().offsetWidth;

// converting string data to float
const parseObject = (d) => {
	d.rcv_time = +d.rcv_time;
	d.send_time = +d.send_time;
	return d;
};

// preparing X data
const xValue = (d) => {
	const ts1 = 1675921681.915128;
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

const scatter_margin = {
	top: 10,
	right: 80,
	bottom: 80,
	left: 80,
};
const radius = 3;

export function scatter_plot(data) {
	let parsedData = data.map(parseObject);

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

	const color_scale = d3
		.scaleOrdinal()
		.domain(d3.extent(parsedData, dstIP))
		.range(["#1b9e77", "#d95f02", "#7570b3"]); // color is selected by using colorbrewer2

	const marks = parsedData.map((d) => ({
		x: x(xValue(d)),
		y: y(yValue(d)),
		color: color_scale(dstIP(d)),
		destination_ip: dstIP(d),
		source_ip: srcIP(d),
		size_in_bytes: pktSize(d),
		//label: `Source IP: ${srcIP(d)}\nDestination IP: ${dstIP(
		//	d
		//)}\nSize: ${pktSize(d)} bytes`,
	}));

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
		.style("fill", (d) => d.color);

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
		.attr("y", 30)
		.attr("transform", "rotate(-90)")
		.text("Queue Depth (avg.)");

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
		.attr("y", scatter_height - 30)
		.text("Time (second)");

	// Create the range slider

	// adding legend (checkbox event)
	const checkbox = d3
		.selectAll("input[type='checkbox'][name='host']")
		.on("change", function () {
			// remove the added_table/table message/selected circle and brush selection box if there is any
			d3.selectAll("#added_table").remove();
			d3.selectAll("#large_circle").remove();
			d3.select("#table_msg").text("No packet is selected");
			d3.select("#brush").call(d3.brush().move, null);

			let selected = this.value;
			const display = this.checked ? "inline" : "none";
			circles
				//.selectAll(".dot")
				.filter((d) => {
					return selected == d.destination_ip;
				})
				.attr("display", display);
		});
	return [scatter_svg, circles];
}
