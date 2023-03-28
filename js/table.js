import { bar_plot } from "./group_bar.js";
import { update_link } from "./topology.js";

// function for create table
export function tabulate(data, columns, scatter_svg, color_scale, nodes) {
	const table = d3.select("#table").append("table").attr("id", "added_table");
	const thead = table.append("thead");
	const tbody = table.append("tbody");

	// append the header row
	thead
		.append("tr")
		.selectAll("th")
		.data(columns)
		.enter()
		.append("th")
		.text(function (column) {
			return column.replaceAll("_", " ").toUpperCase();
		});

	// create a row for each object in the data
	var rows = tbody
		.selectAll("tr")
		.data(data)
		.enter()
		.append("tr")
		.on("click", function () {
			const highlighted = d3.select(this).classed("highlight");

			if (highlighted) {
				// click on a highlighted row
				d3.select(this).classed("highlight", false);
				d3.selectAll("#large_circle").remove();
				bar_plot(Array.from(data), nodes);
				update_link(Array.from(data));
			} else {
				// click on a non-highlighted row
				// Remove "highlight" class from all rows and circles with id large_circle
				d3.selectAll("tr").classed("highlight", false);
				d3.selectAll("#large_circle").remove();
				// Add highlight class to this row.
				d3.select(this).classed("highlight", true);
				const data_point = d3.select(this).data();
				scatter_svg
					.append("circle")
					// .attr("class", "dot")
					.attr("id", "large_circle")
					.attr("cx", data_point[0]["x"])
					.attr("cy", data_point[0]["y"])
					.attr("r", 10)
					.attr("stroke", "#000")
					.attr("stroke-width", 2)
					.attr("display", "inline")
					.style(
						"fill",
						color_scale(data_point[0]["destination_ip"])
					);

				bar_plot(data_point, nodes);
				update_link(data_point);
			}
		});

	// create a cell in each row for each column
	var cells = rows
		.selectAll("td")
		.data(function (row) {
			return columns.map(function (column) {
				return { column: column, value: row[column] };
			});
		})
		.enter()
		.append("td")
		.text(function (d) {
			return d.value;
		});

	return table;
}
