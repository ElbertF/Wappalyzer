/** global: browser */

document.addEventListener('DOMContentLoaded', function() {
	var nodes = document.querySelectorAll('[data-i18n]');

	Array.prototype.forEach.call(nodes, function (node) {
		node.childNodes[0].nodeValue = browser.i18n.getMessage(node.dataset.i18n);
	});
});
