XRegExp.install('natives');

var Sections = function(headers, panes) {
	this.headers = headers;
	this.panes = panes;
	this.onShows = [];
	
	headers.each((function(i, el) {
		var $el = $(el), 
		    show = this.showSection.bind(this, i);
		this[$el.text().trim().camelize()] = {
			show : show, 
			addOnShow : this.addOnShowSection.bind(this, i)
		};
		$el.click(function(ev) {
			ev.preventDefault();
			if (ev.target.href) {
				var parts = ev.target.href.split('#');
				if ( parts.length>1 ) {
					document.location.hash = parts.last();
				}
			}
			show();
		});
	}).bind(this));
};
Sections.prototype.showSection = function(index) {
	this.headers.removeClass("active");
	$(this.headers[index]).addClass("active");

	this.panes.removeClass("active");
	$(this.panes[index]).addClass("active");
	
	this.onShows[index] && this.onShows[index].each(function(handler) {
		handler();
	});
};
Sections.prototype.addOnShowSection = function(index, handler) {
	this.onShows[index] = this.onShows[index] || [];
	this.onShows[index].push(handler);
};

var ButtonManager = function(buttonIds) {
	var byId = this.byId = {};
	this.buttons = buttonIds.words(function(id) {
		return byId[id] = $('#'+id);
	});
};
ButtonManager.prototype.disableAll = function() {
	this.buttons.each(function(el) {
		el.attr("disabled", true);
	});
};
ButtonManager.prototype.enable = function(ids) {
	var toEnable = ids.words();
	this.buttons.each(function(button) {
		button.attr("disabled", toEnable.indexOf(button.attr("id"))==-1);
	});
};

$(document).ready(function($) {
	var debugSections = new Sections($(".section-headers li"), $(".section-panes > div"));
	var mainSections = new Sections($("#menu a"), $("#mainSections > div"));

	var tabBars = $(".tabBar");
	var $menuBar = tabBars.first();
	var $debugBar = tabBars.last();
	
	var $code = $("#code");

	var $run = $("#run");
	var $debug = $("#debug");
	var $step = $("#step");
	var $continue = $("#continue");

	var $sectionPanes = $(".section-panes");
	var $input = $("#input textarea");
	var $output = $("#output");
	var $debugInfo = $("#debugInfo");
	var $trace = $("#trace");
	
	var editor = new Editor($code[0])
	var heightUsedByOtherPageElements = $menuBar.height() + $debugBar.height() + $sectionPanes.height();
	editor.useAvailableHeight(heightUsedByOtherPageElements);
	mainSections.Interpreter.addOnShow(editor.refresh.bind(editor));

	var buttons = new ButtonManager("run debug step continue");

	var updateDebugInfo = function(executionState) {
		var html = "";
		if (executionState) {
			html  = '<table>\
					<tr><th colspan="2">Text Before</th></tr><tr><td colspan="2">'+executionState.text+'</td></tr>\
					<tr><th colspan="2">Text After</th></tr><tr><td colspan="2">'+executionState.nextText+'</td></tr>\
					<tr><th colspan="2">Next Label</th></tr><tr><td colspan="2">'+executionState.nextLabel+'</td></tr>\
					<tr><th colspan="2">Matches</th></tr>';
			for (var i=0, l=executionState.matches.length; i<l; i++) {
				var match = executionState.matches[i];
				html += '<tr><th>'+(l>10 && match.index<=9 ? ' ' : '')+match.index+' '+(match.name||'')+'</th><td class="'+(match.matches===undefined?'undefined':'')+'"><span>'+match.matches+'</span></td></tr>';				
			}
			html +=	'</table>';
		}
		$debugInfo.html(html);
	};

	var updateTrace = function(program) {
		html = '<table>';
		for (var i=0, l=program.trace.length; i<l; i++) {
			html += '<tr><th>'+program.trace[i].label+'</th><td><span>'+program.trace[i].text+'</span></td></tr>';				
		}
		html +=	'</table>';
		$trace.html(html);
	};
	
	var InteractivityHandler = (function() {
	
		var program;
		var pendingExecutionState;

		var handleUserAction = function(executionMode) {
			editor.clearCurrentLine();
			buttons.disableAll();

			if (executionMode==ExecutionMode.Run || executionMode==ExecutionMode.Debug) {
				program = new Program(editor.getValue());
				pendingExecutionState = new ExecutionState();
				pendingExecutionState.text = $input.val();
				$output.html("");
			}
			
			if (executionMode==ExecutionMode.Debug || executionMode==ExecutionMode.Continue || executionMode==ExecutionMode.Step) {
				pendingExecutionState.breakPoints = editor.getBreakPoints();
			}

			pendingExecutionState.executionMode = executionMode;

			program.doContinue(pendingExecutionState, handleExecutionState);
		};

		var handleExecutionState = function(executionState) {
			pendingExecutionState = executionState;

			if (pendingExecutionState.completed) {
				$output.html(pendingExecutionState.text);
				pendingExecutionState = null;
				buttons.enable("run debug");
				debugSections.Output.show();
			} else {
				editor.setCurrentLine(pendingExecutionState.lineNumber);
				buttons.enable("step continue");
				debugSections.DebugInfo.show();
			}

			updateDebugInfo(pendingExecutionState);
			updateTrace(program);
		}
		
		return {
			handleUserAction : handleUserAction,
			handleExecutionState : handleExecutionState
		};
	})();
	
	$run.click(InteractivityHandler.handleUserAction.fill(ExecutionMode.Run));
	$debug.click(InteractivityHandler.handleUserAction.fill(ExecutionMode.Debug));
	$step.click(InteractivityHandler.handleUserAction.fill(ExecutionMode.Step));
	$continue.click(InteractivityHandler.handleUserAction.fill(ExecutionMode.Continue));
	
	buttons.enable("run debug");
	debugSections.Input.show();
	
	var currentMainSection = document.location.hash.from(1).camelize();
	if (mainSections[currentMainSection]) {
		mainSections[currentMainSection].show();
	}
});
