const width = window.innerWidth;
const height = window.innerHeight;

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

	const margin = {
		top: 100,
		right: 100,
		bottom: 200,
		left: 100,
	};
	const radius = 10;
	// return min and max for domain
	const x = d3
		.scaleLinear()
		.domain(d3.extent(parsedData, xValue))
		.range([margin.left, width - margin.right])
		.nice();

	// acts as a setter if we provide a value
	// if we do not provide a value like below, it acts as a getter
	//console.log(x.domain());
	//console.log(x.range());

	const y = d3
		.scaleLinear()
		.domain(d3.extent(parsedData, yValue))
		.range([height - margin.bottom, margin.top]) // this range is flipped because origin is at upper left corner
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

	const svg = d3
		.select("body")
		.append("svg")
		.attr("width", width)
		.attr("height", height);

	const circles = svg
		.selectAll(".dot")
		.data(marks)
		.join("circle")
		.attr("class", "dot")
		.attr("cx", (d) => d.x)
		.attr("cy", (d) => d.y)
		.attr("r", radius)
		.style("fill", (d) => d.color);

	// adding tooltop
	circles.append("title").text((d) => `${d.label}`);

	// Save the current position of the circles in the stacking order
	const initialOrder = circles.order();

	// chaning the z axis of a circle on hover
	svg.selectAll(".dot")
		.on("mouseover", function () {
			d3.select(this)
				.attr("r", radius * 1.2)
				.style("stroke-width", 3);
			d3.select(this).raise();
			//this.parentNode.appendChild(this);
		})
		.on("mouseout", function () {
			d3.select(this).attr("r", radius).style("stroke-width", 0.5);
			circles.order(initialOrder);
		});

	// adding the X and Y axis
	svg.append("g")
		.attr("transform", `translate(${margin.left}, 0)`)
		.call(d3.axisLeft(y));

	svg.append("g")
		.attr("transform", `translate(0, ${height - margin.bottom})`)
		.call(d3.axisBottom(x));

	// adding legend (checkbox event)
	const checkbox = d3
		.selectAll("input[type='checkbox'][name='host']")
		.on("change", function () {
			let selected = this.value;
			const display = this.checked ? "inline" : "none";
			svg.selectAll(".dot")
				.filter((d) => {
					return selected == d.host_ip;
				})
				.attr("display", display);
		});
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
