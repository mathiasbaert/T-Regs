var Enumeration = function(keys) {
	keys.words((function(key) {
		this[key] = key;
	}).bind(this));
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