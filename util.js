var Enumeration = function(keys) {
	keys.words((function(key) {
		this[key] = key;
	}).bind(this));
};
