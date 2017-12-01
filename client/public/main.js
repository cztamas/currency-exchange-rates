"use strict";

const ko = window.ko;
const Rickshaw = window.Rickshaw;
const serverPort = 9871;

let labels = {
	mainErrorMessage: "Service temporarily unavailable. We are sorry.",
	currency1: "currency1",
	currency2: "currency2",
	getConversionRate: "GO",
	showHistory: "Show historical data",
	showHistoryButton: "GO",
	backToHistory: "Go back"
};

const state = ko.observable("exchange");
const rate = ko.observable(null);
const currency1 = ko.observable(null);
const currency2 = ko.observable(null);
const currencyToPlot = ko.observable(null);
const buttonsEnabled = ko.observable(false);
const currencyTypes = ko.observable([]);

window.fetch(`http://localhost:${serverPort}/list`, {
		mode: "cors",
		cache: "no-cache"
	})
	.then(res => res.json())
	.then(res => {
		currencyTypes(res);
		buttonsEnabled(true);
	});

function getConversionRate() {
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
		})
		.catch(err => {
			console.log(err);
		});
}

function showCurrencyGraph() {
	if (!currencyToPlot()) {
		return;
	}
	window.fetch(`http://localhost:${serverPort}/history/${currencyToPlot()}`, {
		mode: "cors",
		cache: "no-cache"
	})
		.then(res => res.json())
		.then(json => json.map(item => ({ x: new Date(item.date).getTime(), y: parseFloat(item.rate) }) ))
		.then(array => array.reverse())
		.then(data => {
			state("graph");

			let graph = new Rickshaw.Graph({
				element: document.querySelector("#graph"),
				renderer: "line",
				width: 300,
				height: 300,
				series: [{
					color: "red",
					data: data
				}]
			});
			graph.render();
		});
}

function backToHistory() {
	state("exchange");
}

ko.applyBindings({
	state: state,
	rate: rate,
	buttonsEnabled: buttonsEnabled,
	currencyTypes: currencyTypes,

	currency1: currency1,
	currency2: currency2,
	currencyToPlot: currencyToPlot,

	getConversionRate: getConversionRate,
	showCurrencyGraph: showCurrencyGraph,
	backToHistory: backToHistory,

	labels: labels
});