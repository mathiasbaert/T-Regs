XRegExp.install('natives');

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

	var hookUpDemoLinks = function() {
		$("a[data-load-demo]").click(function(ev) {
			var codeContainer = $('#'+$(ev.target).attr("data-load-demo"));
			var code = codeContainer.text();
			var input = codeContainer.attr("data-input");
			
			ev.preventDefault();
			interpreter.loadCode(code, input);
			mainSections.Interpreter.show();
		});
	};
	hookUpDemoLinks();
	
	var showMainSectionBasedOnUrlHash = function() {
		var currentMainSection = document.location.hash.from(1).camelize();
		if (mainSections[currentMainSection]) {
			mainSections[currentMainSection].show();
		}
	};
	showMainSectionBasedOnUrlHash();
});
