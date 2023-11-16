(function() { "use strict";
	var reJS = new RegExp( "(^|\\s)no-js(\\s|$)" );
	var className = document.documentElement.className.replace( reJS, "$1js$2" ); // Change `no-js` to `js`

	var scheme = localStorage.getItem( "colorScheme" );
	if ( null !== scheme ) {
		document.documentElement.setAttribute( "data-scheme", scheme );
	}

	function checkCSSsupport( fName ) {
		var pref = [ "Webkit", "Moz", "ms", "O" ];
		var el = document.createElement( "div" );

		if ( el.style[fName] !== undefined ) {
			return true;
		} else {
			for( var i = 0; i < pref.length; i++ ) {
				if ( el.style[ pref[i] + fName.charAt(0).toUpperCase() + fName.substr(1) ] !== undefined ) {
					return true;
				}
			}
		}
		return false;
	}

	className += ( ( "ontouchstart" in window ) || window.DocumentTouch && document instanceof DocumentTouch ) ? " touchevents" : " no-touchevents";

	className += checkCSSsupport( "transition" ) ? " csstransitions" : " no-csstransitions";

	document.documentElement.className = className;
})();
