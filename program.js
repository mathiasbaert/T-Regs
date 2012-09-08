var Program = (function() {
	var Error = function(message, lineNumber, label) {
		this.message = message;
		this.lineNumber = lineNumber;
		this.label = label;
	};
	
	var Line = (function() {
		var linePattern = XRegExp(
			'^                               \
				(?<label>\\d+)               \
				\\s*                         \
				/                            \
					(?<find>(\\/|[^/])*)     \
				/                            \
					(?<replace>(\\/|[^/])*)  \
				/                            \
					(?<flags>[sngim]*)       \
			$', 'xn');
			
		var Line = function(number, text) {
			var match = linePattern.exec(text);
			if (!match) {
				this.error = new Error("This is not valid syntax: \""+text+"\"");
				return;
			}
			this.number = number;
			this.label = Number(match.label);
			try {
				this.find = XRegExp(match.find||"", match.flags||"");
			} catch (e) {
				this.error = new Error(e.message, this.number, this.label);
			}
			this.replace = match.replace||"";
		}
		Line.prototype.run = function(text) {
			var newText = text;
			try {
				var matches = (this.find.exec(text)||{}),
					captures = [],
					captureNames = this.find.xregexp.captureNames||[];

				for(var i=0, l=captureNames.length; i<=l; i++) {
					captures.push({
						index : i,
						name : captureNames[i-1],
						matches : matches[i]
					});
				}
				newText = text.replace(this.find, this.replace)
			} catch (e) {
				return {
					error : new Error(e.message, this.number, this.label)
				};
			}
			
			return {
				matches : captures,
				'goto' : matches['goto'],
				text : newText
			};
		}
		
		return Line;
	})();

	var Program = function(code) {
		var lineCounter = 0;
		
		var errors = this.errors = [];

		this.lines = code
			.split("\n")
			.map(function(text) {return {number:lineCounter++, text:text.trim()}})
			.exclude(
				function(line) {return line.text.length==0 || line.text.startsWith("#")}
			)
			.map(function(line) {
				var line = new Line(line.number, line.text);
				if (line.error) {
					errors.push(line.error);
				}
				return line;
			})
			.sortBy("label");
			
		if (this.errors.length) {
			this.lines = [];
			return;
		}
			
		this.lookupByLabel = {};
		this.lookupByLineNumber = {};

		for(var i=0; i<this.lines.length && !this.errors.length; i++) {
			if (this.lookupByLabel[this.lines[i].label]) {
				this.errors.push(new Error("Line with Label \""+this.lines[i].label+"\" is defined more then once.", null, this.lines[i].label));
			} 
			else {
				this.lookupByLabel[this.lines[i].label] = {
					line : this.lines[i],
					nextLabel : this.lines[i+1] ? this.lines[i+1].label : null
				};	
				this.lookupByLineNumber[this.lines[i].lineNumber] = {
					line : this.lines[i]
				};	
			}
		}
	};
	
	var step = function(executionState) {
		var currentLine = this.lookupByLabel[executionState.label].line;
		
		var result = currentLine.run(executionState.text);

		executionState.text = result.text;
		executionState.error = result.error;
		
		setExecutionStateLabel.call(this, executionState, result.goto ? result.goto : this.lookupByLabel[currentLine.label].nextLabel);
		if ( executionState.hasLabel() ) {
			executionState.completed = false;
		}
		else {
			executionState.completed = true;
		}
		
		return executionState;
	};

	var setExecutionStateLabel = function(executionState, label) {
		executionState.label = label;
		if (executionState.hasLabel() && this.lookupByLabel[executionState.label]) {
			executionState.lineNumber = this.lookupByLabel[executionState.label].line.number;
		}
		else {
			executionState.lineNumber = -1;
		}
	};
	
	var setExecutionStateDebugInfo = function(executionState) {
		if (!executionState.completed) {
			var currentLine = this.lookupByLabel[executionState.label].line;
			var result = currentLine.run(executionState.text);
			executionState.matches = result.matches;
			executionState.nextText = result.text;
			executionState.nextLabel = result.goto ? result.goto : this.lookupByLabel[currentLine.label].nextLabel;
		}
	};
	
	var startTrace = function(text) {
		this.trace = [];
		trace.call(this, "input", text);
	};
	
	var trace = function(label, text) {
		this.trace.push({label:label, text:text});
	}

	var startErrors = function() {
		this.errors = [];
	};
	
	var error = function(error) {
		this.errors.push(error);
	}
	
	Program.prototype.doContinue = function(executionState, executionStateHandler) {
		if (this.lines.isEmpty() || executionState.completed) {
			executionState.completed = true;
		}
		else {
			if (executionState.executionMode==ExecutionMode.Run || 
				executionState.executionMode==ExecutionMode.Debug) {
				setExecutionStateLabel.call(this, executionState, this.lines[0].label);
				startTrace.call(this, executionState.text);
				startErrors.call(this);
			}
			var previousLabel;
			if (executionState.executionMode==ExecutionMode.Step || 
				executionState.executionMode==ExecutionMode.Continue) {
				var label = executionState.label;
				executionState = step.call(this, executionState);
				if (executionState.error) {
					error.call(this, executionState.error);
				} else {
					trace.call(this, label, executionState.text);
				}
			}
			if ((!this.errors || !this.errors.length) && (
				executionState.executionMode==ExecutionMode.Run || 
				executionState.executionMode==ExecutionMode.Debug ||
				executionState.executionMode==ExecutionMode.Continue)) {
				while (true) {
					if (executionState.hasLabel() && !this.lookupByLabel[executionState.label]) {
						error.call(this, new Error("There is no instruction with label \""+executionState.label+"\"", null, label));
						break;
					}
					if (!(
							executionState.hasLabel() && 
							executionState.breakPoints.indexOf(this.lookupByLabel[executionState.label].line.number)==-1
						)) {
							break;
					}
					var label = executionState.label;
					executionState = step.call(this, executionState);
					if (executionState.error) {
						error.call(this, executionState.error);
						break;
					} else {
						trace.call(this, label, executionState.text);
					}
				}
			}
			if (executionState.executionMode==ExecutionMode.Debug ||
				executionState.executionMode==ExecutionMode.Step || 
				executionState.executionMode==ExecutionMode.Continue) {
				setExecutionStateDebugInfo.call(this, executionState);
			}
		}

		executionStateHandler(executionState);		
	};
	
	return Program;
})();
