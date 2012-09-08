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


var Sections = function(headers, panes) {
	this.headers = headers;
	this.panes = panes;
	this.onShows = [];
	
	headers.each((function(i, el) {
		var $el = $(el), 
		    show = this.showSection.bind(this, i),
		    isVisible = this.isVisible.bind(this, i);
		this[$el.text().trim().camelize()] = {
			show : show, 
			isVisible : isVisible, 
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
	
	$("html").animate({scrollTop : 0}, 0);
	
	this.onShows[index] && this.onShows[index].each(function(handler) {
		handler();
	});
};
Sections.prototype.isVisible = function(index) {
	return $(this.headers[index]).hasClass("active");
};
Sections.prototype.addOnShowSection = function(index, handler) {
	this.onShows[index] = this.onShows[index] || [];
	this.onShows[index].push(handler);
};
