$(document).ready(function($) {
	var mainSections = new Sections($("#menu a"), $("#mainSections > div"));

	var $menuBar = $(".tabBar").first();

	var interpreter = new Interpreter($("#interpreter"));
	mainSections.Interpreter.addOnShow(interpreter.notifyBecameVisible.bind(interpreter));
	
	var hookUpNavigationLinks = function() {
		$("a[href=#spec]").click(function(ev) {
			ev.preventDefault();
			mainSections.Spec.show();
		});
	};
	hookUpNavigationLinks();

	var loadDemoCodeByName = function(name) {
			var codeContainer = $('#'+name);
			var code = codeContainer.text();
			var input = codeContainer.attr("data-input");
			
			interpreter.loadCode(code, input);
			mainSections.Interpreter.show();
	};
	
	var hookUpDemoLinks = function() {
		$("a[data-load-demo]").click(function(ev) {
			loadDemoCodeByName($(ev.target).attr("data-load-demo"));
			ev.preventDefault();
		});
	};
	hookUpDemoLinks();
	
	var loadDemoIfInUrl = function() {
		var match;
		if (match = document.location.hash.match(/#interpreter\|(.*)/)) {
			loadDemoCodeByName(match[1]);
		}
	};
	loadDemoIfInUrl();
	
	var showMainSectionBasedOnUrlHash = function() {
		var currentMainSection = document.location.hash.from(1).camelize();
		if (mainSections[currentMainSection]) {
			mainSections[currentMainSection].show();
		}
	};
	showMainSectionBasedOnUrlHash();
});
