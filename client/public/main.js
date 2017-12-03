"use strict";

const ko = window.ko;
const Rickshaw = window.Rickshaw;
const serverPort = 9871;
const maxRetryCount = 5; // Number of consecutive retries if cannot connect to the server.

let labels = {
	errors: {
		mainMessage: "Service temporarily unavailable. We are sorry.",
		message: "An error happened while loading your data. We are sorry."
	},
	currency1: "Convert 1 ",
	currency2: "to",
	getConversionRate: "GO",
	showHistory: "Show historical exchange rate data",
	showHistoryButton: "GO",
	backToHistory: "Go back"
};

const state = ko.observable("exchange");
const currency1 = ko.observable(null);
const currency2 = ko.observable(null);
const currencyToPlot = ko.observable(null);
const buttonsEnabled = ko.observable(false);
const currencyTypes = ko.observable([]);
const rate = ko.observable(null);
const rateResult = ko.computed(function() {
	return `1.00 ${currency1()} = ${rate()} ${currency2()}`;
});
const rateResultVisible = ko.observable(false);
const errorsVisible = {
	exchange: ko.observable(false),
	graph: ko.observable(false),
	main: ko.observable(false)
};

// Hides the rate exchange result when we change a currency type.
ko.computed(function() {
	currency1();
	currency2();
	rateResultVisible(false);
});

let retryCount = 0;
// Initializing the service...
function loadCurrencyTypes() {
	window.fetch(`http://localhost:${serverPort}/list`, {
			mode: "cors",
			cache: "no-cache"
		})
		.then(res => res.json())
		.then(res => {
			currencyTypes(res);
			buttonsEnabled(true);
			retryCount = 0;
		})
		.catch(() => {
			retryCount += 1;
			if (retryCount > maxRetryCount) {
				state(null);
				errorsVisible.main(true);
				return;
			}
			loadCurrencyTypes();
		});
}

function getConversionRate() {
	errorsVisible.exchange(false);
	if (!currency1() || !currency2()) {
		return;
	}
	window.fetch(`http://localhost:${serverPort}?c1=${currency1()}&c2=${currency2()}`, {
		mode: "cors",
		cache: "no-cache"
	})
		.then(res => res.json())
		.then(res => {
			console.log(res);
			rate(res.rate);
			rateResultVisible(true);
		})
		.catch(err => {
			errorsVisible.exchange(true);
			console.log(err);
		});
}

function showCurrencyGraph() {
	errorsVisible.graph(false);
	if (!currencyToPlot()) {
		return;
	}
	window.fetch(`http://localhost:${serverPort}/history/${currencyToPlot()}`, {
		mode: "cors",
		cache: "no-cache"
	})
		.then(res => res.json())
		.then(json => json.map(item => ({ x: new Date(item.date).getTime() / 1000, y: parseFloat(item.rate) }) ))
		.then(renderGraph)
		.catch(err => {
			errorsVisible.graph(true);
			console.log(err);
		});
}

function renderGraph(data) {
	// This destroys the previous graph.
	state(null);
	state("graph");
	let graphHolder = document.getElementById("graph");
	let y_min = Math.min(...data.map(point => point.y));

	let graph = new Rickshaw.Graph({
		element: graphHolder,
		renderer: "line",
		width: graphHolder.clientWidth,
		height: graphHolder.clientHeight,
		series: [{
			color: "red",
			data: data
		}],
		min: y_min
	});

	let x_axis = new Rickshaw.Graph.Axis.Time( { graph: graph } );
	let y_axis = new Rickshaw.Graph.Axis.Y( {
        graph: graph,
        orientation: "left",
        tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
        element: document.getElementById("graph-y-axis"),
	} );

	let hoverDetail = new Rickshaw.Graph.HoverDetail({
		graph: graph,
		formatter: (series, x, y) => `
			<span class="hover-date">
				${new Date(x * 1000).toUTCString()}
			</span><br>
			<span class="hover-value">
				EUR/${currencyToPlot()} exchange rate: ${y}
			</span>`
	});

	graph.render();
}

function backToHistory() {
	state("exchange");
}

loadCurrencyTypes();

ko.applyBindings({
	state: state,
	rateResult: rateResult,
	rateResultVisible: rateResultVisible,
	buttonsEnabled: buttonsEnabled,
	currencyTypes: currencyTypes,

	currency1: currency1,
	currency2: currency2,
	currencyToPlot: currencyToPlot,

	getConversionRate: getConversionRate,
	showCurrencyGraph: showCurrencyGraph,
	backToHistory: backToHistory,

	errorsVisible: errorsVisible,
	labels: labels
});