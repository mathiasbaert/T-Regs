var Editor = (function() {
	var Editor = function(textarea) {
		this.editor = CodeMirror.fromTextArea(textarea, {
			lineWrapping : true,
			electricChars : false,
			gutter : true,
			matchBrackets : true,
			autofocus : true,
			onGutterClick : function(editor, lineNumber) {
				var info = editor.lineInfo(lineNumber);
				if (info.markerText) {
					editor.clearMarker(lineNumber);
				} else {
					editor.setMarker(lineNumber, "<span class=\"breakpoint\"></span> %N%");
				}
			}
		});
		
		$(window).resize(updateHeight.bind(this));

	};

	Editor.prototype.getBreakPoints = function() {
		var breakPoints = [];
		for(var i=0, l=this.editor.lineCount(); i<l; i++) {
			var info = this.editor.lineInfo(i);
			if (info.markerText) {
				breakPoints.push(i);
			}
		}
		return breakPoints;
	};

	Editor.prototype.clearCurrentLine = function() {
		if (Object.isNumber(this.currentLine)) {
			this.editor.setLineClass(this.currentLine, null);
			this.currentLine = null;
		}
	};

	Editor.prototype.setCurrentLine = function(lineNumber) {
		this.currentLine = lineNumber;
		this.editor.setLineClass(lineNumber, "activeline");
	};

	Editor.prototype.setValue = function(value) {
		return this.editor.setValue(value);
	};
	
	Editor.prototype.getValue = function() {
		return this.editor.getValue();
	};

	var updateHeight = function() {
		if (!this.heightUsedByOtherPageElements) { return; }
		this.editor.setSize(null, $(window).height() - this.heightUsedByOtherPageElements);
		this.editor.refresh();
	};

	Editor.prototype.useAvailableHeight = function(heightUsedByOtherPageElements) {
		this.heightUsedByOtherPageElements = heightUsedByOtherPageElements;
		updateHeight.call(this);
	};
	
	Editor.prototype.refresh = function() {
		this.editor.refresh();
	};
	
	return Editor;
})();
