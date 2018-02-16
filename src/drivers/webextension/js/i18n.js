/** global: browser */

document.addEventListener('DOMContentLoaded', function() {
	var
		i, value,
		nodes = document.querySelector('*');

	for ( i = 0; i < nodes.length; i ++ ) {
		if ( value = nodes[i].dataset.i18n ) {
			nodes[i].innerHTML = browser.i18n.getMessage(value);
		}
	}
});
