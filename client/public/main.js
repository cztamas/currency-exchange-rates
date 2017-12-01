"use strict";

const ko = window.ko;

let labels = {
	mainErrorMessage: "Service temporarily unavailable. We are sorry."
};

let state = ko.observable("");

window.addEventListener("click", () => state("error"));

ko.applyBindings({
	state: state,
	labels: labels
});