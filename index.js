const width = window.innerWidth;
const height = window.innerHeight;

const scatter_height =
	d3.select("#scatter").node().offsetHeight -
	d3.select("#label_h1").node().offsetHeight;
const scatter_width = d3.select("#scatter").node().offsetWidth;

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

// data processing and plotting
const main = async () => {
	const data = await d3.json(jsonUrl).catch((error) => {
		console.error(error);
	});
	let parsedData = data.map(parseObject);

	const scatter_margin = {
		top: 10,
		right: 80,
		bottom: 80,
		left: 80,
	};
	const radius = 3;
	// return min and max for domain
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
		host_ip: dstIP(d),
		label: `Source IP: ${srcIP(d)}\nDestination IP: ${dstIP(
			d
		)}\nSize: ${pktSize(d)} bytes`,
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

	// adding the X and Y axis
	scatter_svg
		.append("g")
		.attr("transform", `translate(${scatter_margin.left}, 0)`)
		.call(d3.axisLeft(y));

	scatter_svg
		.append("g")
		.attr(
			"transform",
			`translate(0, ${scatter_height - scatter_margin.bottom})`
		)
		.call(d3.axisBottom(x));

	// adding legend (checkbox event)
	const checkbox = d3
		.selectAll("input[type='checkbox'][name='host']")
		.on("change", function () {
			let selected = this.value;
			const display = this.checked ? "inline" : "none";
			circles
				//.selectAll(".dot")
				.filter((d) => {
					return selected == d.host_ip;
				})
				.attr("display", display);
		});

	// brush activity
	scatter_svg.call(d3.brush().on("start brush end", brushed));

	function brushed({ selection }) {
		// selection containes the x,y coordinates of starting and end position
		//console.log(selection);
		const value = new Set();
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
			console.log("else");
		}
		console.log(value); // addd the value to the table
	}
};

main();

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
