CodeMirror.defineMode("regexlang", function(config) {
	var Token = {
		'Comment' : 'comment',
		'LineNumber' : 'keyword',
		'Regex' : 'string',
		'Slash' : 'keyword',
		'Unexpected' : 'error'
	};

	var Expectation = {
		'Anything' : 0,
		'FirstSlash' : 1,
		'SecondSlash' : 2,
		'ThirdSlash' : 3,
		'EOL' : 4
	};
	
	return {
		startState: function() {
			return {
				expectation : Expectation.Anything
			};
		},

		token: function(stream, state) {
			var type = null;
			if (stream.sol()) {
				if (stream.eat('#')) {
					type = Token.Comment;
					stream.skipToEnd();
				} else if (stream.match(/\d+/)) {
					type = Token.LineNumber;
					state.expectation = Expectation.FirstSlash;
					stream.eatSpace();
				} else {
					type = Token.Unexpected;
					stream.skipToEnd();
				}
			} else {
				if (state.expectation == Expectation.FirstSlash) {
					if (stream.eat('/')) {
						type = Token.Slash;
						state.expectation = Expectation.SecondSlash;
					} else {
						type = Token.Unexpected;
						stream.next();
					}
				} else if (state.expectation == Expectation.SecondSlash) {
					if (stream.eat('/')) {
						type = Token.Slash;
						state.expectation = Expectation.ThirdSlash;
					}
					else if (stream.match(/(\\.|[^\/])+/)) {
						type = Token.Regex;
					}
				} else if (state.expectation == Expectation.ThirdSlash) {
					if (stream.eat('/')) {
						type = Token.Slash;
						state.expectation = Expectation.EOL;
					}
					else if (stream.match(/(\\.|[^\/])+/)) {
						type = Token.Regex;
					}
				} else if (state.expectation == Expectation.EOL) {
					type = Token.Unexpected;
					stream.skipToEnd();
				}
			}

			return type;
		}
	};
});

CodeMirror.defineMIME("text/x-regexlang", "regexlang");
