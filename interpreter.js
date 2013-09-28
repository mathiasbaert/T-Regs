var Interpreter = function(container) {
	
	var $code = container.find("#code");

	var $run = container.find("#run");
	var $debug = container.find("#debug");
	var $step = container.find("#step");
	var $continue = container.find("#continue");

	var $sectionPanes = container.find(".section-panes");
	var $input = container.find("#input textarea");
	var $output = container.find("#output");
	var $debugInfo = container.find("#debugInfo");
	var $trace = container.find("#trace");
	var $errors = container.find("#errors");
	
	var debugSections = new Sections($(".section-headers li"), $(".section-panes > div"));
	var $debugBar = container.find(".tabBar");
	
	var editor = new Editor($code[0]);
	
	var offsetTop = 0;
	// offset() doesn't seem to be working
	var i=10
	for (var parent = container; parent[0]!=document && i; parent = parent.parent(), i--) {
		offsetTop += parent.offset().top; 
	}
	var heightUsedByOtherPageElements = offsetTop + $debugBar.height() + $sectionPanes.height();
	editor.useAvailableHeight(heightUsedByOtherPageElements);

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
		var html = "";
		if (program.trace) {
			html += '<table>';
			for (var i=0, l=program.trace.length; i<l; i++) {
				html += '<tr><th>'+program.trace[i].label+'</th><td><span>'+program.trace[i].text+'</span></td></tr>';				
			}
			html +=	'</table>';
		}
		$trace.html(html);
	};
	var updateErrors = function(program) {
		var html = "";
		if (program.errors) {
			html += '<table><thead><tr><th>Label</th><th>Message</th></tr></thead><tbody>';
			for (var i=0, l=program.errors.length; i<l; i++) {
				html += '<tr><th>'+program.errors[i].label+'</th><td><span>'+program.errors[i].message+'</span></td></tr>';				
			}
			html +=	'</tbody></table>';
		}
		$errors.html(html);
	};
	
	var InteractivityHandler = (function() {
	
		var program;
		var pendingExecutionState;

		var handleUserAction = function(executionMode) {
			editor.clearCurrentLine();
			buttons.disableAll();

			if (executionMode==ExecutionMode.Run || executionMode==ExecutionMode.Debug) {
				program = new Program(editor.getValue());
				if (program.errors.length) {
					exitProgram(program);
					return;
				}
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

			if (pendingExecutionState.completed || program.errors.length) {
				exitProgram(program, pendingExecutionState);
				return;
			}
		
			editor.setCurrentLine(pendingExecutionState.lineNumber);
			buttons.enable("step continue");
			if (!debugSections.Trace.isVisible()) {
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

	var exitProgram = function(program, pendingExecutionState) {
		$debugInfo.html("");
		updateTrace(program);

		if (pendingExecutionState) {
			$output.html(pendingExecutionState.text);
			debugSections.Output.show();
		}

		if (program.errors.length) {
			updateErrors(program);
			debugSections.Errors.show();
		}
		
		buttons.enable("run debug");
	};
		
	var reset = function() {
		$input.val("");
		$output.html("");
		$debugInfo.html("");
		$trace.html("");
		$errors.html("");
	
		editor.clearCurrentLine();
		editor.clearBreakPoints();

		buttons.enable("run debug");
		debugSections.Input.show();
	};
	
	$run.click(InteractivityHandler.handleUserAction.fill(ExecutionMode.Run));
	$debug.click(InteractivityHandler.handleUserAction.fill(ExecutionMode.Debug));
	$step.click(InteractivityHandler.handleUserAction.fill(ExecutionMode.Step));
	$continue.click(InteractivityHandler.handleUserAction.fill(ExecutionMode.Continue));
	
	reset();
	
	return  {
		notifyBecameVisible : function() {
			editor.refresh();
		},
		loadCode : function(code, input) {
			reset();
			editor.setValue(code);
			$input.val(Util.makeEscapedSpecialCharactersReal(input||""));
		}
	};
};