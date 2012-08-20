var ExecutionMode = new Enumeration("Run Debug Step Continue");

var ExecutionState = function(options) {
	options = options || {};
	this.label = options.label;
	this.lineNumber = -1;
	this.text = options.text || "";
	this.breakPoints = options.breakPoints || [];
	this.executionMode = options.executionMode || ExecutionMode.Run;
	this.completed = false;
};

ExecutionState.prototype.hasLabel = function() {
	return this.label>=0 && this.label!=null;
}
