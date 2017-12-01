"use strict";

const express = require("express");
const http = require("http");
const parser = require("xml2js");

const dataUrl = "http://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist-90d.xml";
const port = 9871;
const updateTimeout = 3600 * 1000; // Check for updates hourly.

const app = express();

// Using a plain JS object for data storage for the sake of simplicity.
// Of course in production, with larger amounts of data we would use a DB.
let currentData = {
	history: {},
	current: {},
	types: []
};

app.get("/history/:currency/", (req, res) => {
	let currency = req.params.currency;
	let data = currentData.history[currency];
	if (!data) {
		return res.status(404).send({
			error: `Unknown currency code: ${currency}`
		});
	}
	res.status(200).send(data);
});

app.get("/list", (req, res) => {
	res.status(200).send(currentData.types);
});

app.get("/", (req, res) => {
	let currency1 = req.query.c1;
	let currency2 = req.query.c2;
	if (!currentData.current[currency1]) {
		return res.status(404).send({
			error: `Unknown currency code: ${currency1}`
		});
	}
	if (!currentData.current[currency2]) {
		return res.status(404).send({
			error: `Unknown currency code: ${currency2}`
		});
	}
	let rate1 = parseFloat(currentData.current[currency1]);
	let rate2 = parseFloat(currentData.current[currency2]);
	let rate = rate2 / rate1;
	res.status(200).send({
		rate: rate
	});
});

app.get("/ping", (req, res) => {
	res.status(200).send("pong");
});

function updateCurrencyData(callback) {
	let xmlData = "";
	let newData = {
		history: {},
		current: {},
		types: []
	};

	http.get(dataUrl, res => {
		res.on("data", data => {
			xmlData += data;
		});
		res.on("end", () => {
			parser.parseString(xmlData, (err, json) => {
				if (err) {
					return console.log("An error happened while parsing the data:", err);
				}
				let dataRows = json["gesmes:Envelope"].Cube[0].Cube;
				let latestDataRow = dataRows[0].Cube;

				latestDataRow.forEach(item => {
					let data = item.$;
					newData.current[data.currency] = data.rate;
					newData.types.push(data.currency);
					newData.history[data.currency] = {};
				});

				dataRows.forEach(row => {
					let date = row.$.time;
					let items = row.Cube;
					items.forEach(item => {
						let data = item.$;
						newData.history[data.currency][date] = data.rate;
					});
				});

				currentData = newData;
				callback();
			});
		});
		res.on("error", console.log);
	});
}

// Start the server.
updateCurrencyData(() => {
	app.listen(port, console.log(`Server is listening on http://localhost:${port}`));
});

// Check for updates regularly.
setInterval(() => {
	updateCurrencyData(() => {
		console.log(`Data updated at ${new Date()}`);
	});
}, updateTimeout);
