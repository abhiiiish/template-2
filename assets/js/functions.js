/*
	* Template functions file.
	*
	*/
jQuery( function() { "use strict";

	var screen_has_mouse = false;
	var $body = jQuery( "body" );
	var $top = jQuery( "#top-header" );
	var $header_title = jQuery( "#header-title" );
	var $featured = jQuery( "#featured" );
	var $site_content = jQuery( "#content" );
	var animCSSDuration = window.getComputedStyle( document.documentElement ).getPropertyValue( "--animation-duration" );
	var transitionCSSDuration = window.getComputedStyle( document.documentElement ).getPropertyValue( "--transition-duration" );
	var animMiliseconds = 1000;
	var transitionMiliseconds = 500;
	var submenuTopLimit;

	if ( animCSSDuration ) {
		animMiliseconds = parseInt( parseFloat( animCSSDuration ) * ( animCSSDuration.indexOf( "ms" ) !== -1 ? 1 : 1000 ), 10);
	}

	if ( transitionCSSDuration ) {
		transitionMiliseconds = parseInt( parseFloat( transitionCSSDuration ) * ( transitionCSSDuration.indexOf( "ms" ) !== -1 ? 1 : 1000 ), 10);
	}

	// Simple way of determining if user is using a mouse device.
	function themeMouseMove() {
		screen_has_mouse = true;
	}
	function themeTouchStart() {
		jQuery( window ).off( "mousemove.katerina" );
		screen_has_mouse = false;
		setTimeout(function() {
			jQuery( window ).on( "mousemove.katerina", themeMouseMove );
		}, 250);
	}
	if ( ! navigator.userAgent.match( /(Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini)/g ) ) {
		jQuery( window ).on( "touchstart.katerina", themeTouchStart ).on( "mousemove.katerina", themeMouseMove );
		if ( window.navigator.msPointerEnabled ) {
			document.addEventListener( "MSPointerDown", themeTouchStart, false );
		}
	}

	// Handle both mouse hover and touch events for traditional menu + mobile hamburger.
	jQuery( "#menu-toggle" ).on( "click.katerina", function( e ) {
		$body.toggleClass( "mobile-menu-opened" );
		e.stopPropagation();
		e.preventDefault();

		if ( $body.hasClass( "mobile-menu-opened" ) && $featured.length > 0 && window.scrollY < ( $featured.outerHeight() / 2 ) ) {
			scrollTo($top.offset().top, animMiliseconds);
		}
	});

	jQuery( "#menu-main .current-menu-parent" ).addClass( "collapse" );

	jQuery( document ).on({
		mouseenter: function() {
			if ( screen_has_mouse ) {
				jQuery( this ).addClass( "hover" );
			}
		},
		mouseleave: function() {
			if ( screen_has_mouse ) {
				jQuery( this ).removeClass( "hover" );
			}
		}
	}, "#menu-main li:not(.menu-item-scheme,.menu-item-cart,.menu-item-search)" );

	if ( jQuery( "html" ).hasClass( "touchevents" ) ) {
		jQuery( "#menu-main .menu-item-has-children > a" ).on( "click.katerina", function (e) {
			if ( ! screen_has_mouse && ! window.navigator.msPointerEnabled && ! jQuery( "#menu-toggle" ).is( ":visible" ) ) {
				if ( ! jQuery( this ).parents( ".hover" ).length ) {
					jQuery( ".site-header .menu .menu-item-has-children" ).not( jQuery( this ).parent() ).removeClass( "hover" );
				}
				jQuery( this ).parent().toggleClass( "hover" );
				e.preventDefault();
			}
		});
	} else {
		// Toggle visibility of dropdowns on keyboard focus events.
		jQuery( "#menu-main li > a, .site-identity a, #search-form-input" ).on( "focus.katerina blur.katerina", function(e) {
			if ( screen_has_mouse && ! jQuery( "#menu-toggle" ).is( ":visible" ) ) {
				if ( ! jQuery( this ).parents( ".hover" ).length ) {
					jQuery( "#menu-main .menu-item-has-children.hover" ).not( jQuery( this ).parent() ).removeClass( "hover" );
				}
				if ( jQuery( this ).parent().hasClass( "menu-item-has-children" ) ) {
					jQuery( this ).parent().addClass( "hover" );
				}
				e.preventDefault();
			}
		});
	}

	// Toggle visibility of dropdowns if touched outside the menu area.
	jQuery( document ).on( "click.katerina", function( e ) {
		if ( jQuery( e.target ).parents( "#menu-main" ).length > 0 ) {
			return;
		}
		jQuery( "#menu-main .menu-item-has-children.hover" ).removeClass( "hover" );
		$body.removeClass( "searchform-opened" );
	});

	jQuery( "#menu-main .menu-item-has-children > a" ).on( "click.katerina", function (e) {
		if ( jQuery( "#menu-toggle" ).is( ":visible" ) ) {
			jQuery( this ).parent().toggleClass( "collapse" );
			e.preventDefault();
		}
	});

	// Toggle scheme (light or dark).
	jQuery( "#menu-main .menu-item-scheme > a" ).on( "click.katerina", function ( e ) {
		var current_scheme = jQuery( "html" ).attr( "data-scheme" );
		var cookie_expires = new Date();
		if ( "default" === current_scheme ) {
			current_scheme = "dark";
		} else {
			current_scheme = "default";
		}
		jQuery( "html" ).attr( "data-scheme", current_scheme );
		localStorage.setItem( "colorScheme", current_scheme );
		e.stopPropagation();
		e.preventDefault();
	});

	// Toggle visibility of search form in primary menu.
	jQuery( "#menu-main .menu-item-search > a" ).on( "click.katerina", function ( e ) {
		$body.toggleClass( "searchform-opened" );
		if ( $body.hasClass( "searchform-opened" ) ) {
			window.setTimeout( function() {
				jQuery( "#menu-main .searchform input[type=search]" ).focus();
			}, 150 );
		}
		e.stopPropagation();
		e.preventDefault();
	});

	// Hide search form if ESC character is pressed
	jQuery( "#menu-main .searchform input[type=search] ").on( "keyup", function( e ) {
		if ( 27 === e.keyCode ) {
			$body.removeClass( "searchform-opened" );
		}
	});

	// Handle navigation stickiness.
	if ( $body.hasClass( "navbar-sticky" ) ) {
		var top_nav_height;
		var stickyTopLimit;
		var isSticky;

		var update_sticky_nav_variables = function() {
			top_nav_height  = $top.outerHeight();
			if ( $featured.length > 0 ) {
				stickyTopLimit = $featured.outerHeight() + $header_title.outerHeight();
			} else {
				stickyTopLimit = $top.outerHeight() + $header_title.outerHeight();
			}
			if (Number.isNaN(stickyTopLimit)) {
				stickyTopLimit = 0;
			}
		};

		jQuery( window ).on( "resize.katerina", function() {
			if ( ! jQuery( "#menu-toggle" ).is( ":visible" ) ) {
				isSticky = $body.hasClass( "navbar-is-sticky" );
				$body.removeClass( "navbar-is-sticky" );
				update_sticky_nav_variables();
				if ( isSticky ) {
					$body.addClass( "navbar-is-sticky" );
				}

				// On scroll, we want to stick/unstick the navigation.
				if ( ! $top.hasClass( "navbar-sticky-watching" ) ) {
					$top.addClass( "navbar-sticky-watching" );
					jQuery( window ).on( "scroll.katerina", function() {
						isSticky = $body.hasClass( "navbar-is-sticky" );
						if ( window.scrollY > stickyTopLimit ) {
							if ( ! isSticky ) {
								$body.addClass( "navbar-is-sticky" );
								if ( $header_title.length > 0 ) {
									if ( parseInt( $header_title.css( "margin-top" ), 10 ) !== top_nav_height ) {
										$header_title.css( "margin-top", top_nav_height );
									}
								} else {
									if ( parseInt( $site_content.css( "margin-top" ), 10 ) !== top_nav_height ) {
										$site_content.css( "margin-top", top_nav_height );
									}
								}
							}
						} else {
							if ( isSticky ) {
								$body.removeClass( "navbar-is-sticky" );
								$header_title.css( "margin-top", "" );
								$site_content.css( "margin-top", "" );
							}
						}
					} );
				}
			} else {
				if ( $top.hasClass( "navbar-sticky-watching" ) ) {
					$top.removeClass( "navbar-sticky-watching" );
					jQuery( window ).unbind( "scroll.katerina" );
					$body.removeClass( "navbar-is-sticky" );
					$header_title.css( "margin-top", "" );
				}
			}
		});
	}

	// Performant smooth scrolling using requestAnimationFrame
	function scrollTo(yPos, animDuration = 1000) {
		var startY = window.scrollY;
		var difference = yPos - startY;
		var startTime = window.performance.now();

		function scrollStep() {
			var progress = (window.performance.now() - startTime) / animDuration - 1;
			var amount = progress * progress * progress + 1; // easeOutCubic
			window.scrollTo({ top: startY + amount * difference });
			if ( progress < 0 ) {
				window.requestAnimFrame( scrollStep );
			}
		}
		scrollStep();
	}

	// Scroll to header functionality.
	jQuery( "#scroll-to-header" ).on( "click.katerina", function( e ) {
		e.preventDefault();
		var $target = jQuery( jQuery( this ).attr( "href" ) );
		scrollTo( $target.offset().top, animMiliseconds );
	});


	// Toggle go-to-top visibility and avoid using any event on mobile devices (for better performance).
	if ( jQuery( "#scroll-to-top" ).length > 0 ) {
		var goToTopLimit = 0;

		// Scroll to top functionality.
		jQuery( "#scroll-to-top" ).on( "click.katerina", function( e ) {
			e.preventDefault();
			scrollTo(0, animMiliseconds);
		});

		jQuery( window ).on( "resize.to-top-katerina", function() {
			if ( window.innerWidth >= 768 ) {
				if ( $featured.length > 0 ) {
					goToTopLimit = $featured.outerHeight() + $header_title.outerHeight();
				} else {
					goToTopLimit = $top.outerHeight() + $header_title.outerHeight();
				}
				if ( ! jQuery( "#scroll-to-top" ).hasClass( "watching" ) ) {
					jQuery( "#scroll-to-top" ).addClass( "watching" );
					jQuery( window ).on( "scroll.to-top-katerina", function() {
						jQuery( "#scroll-to-top" ).toggleClass( "active", jQuery( window ).scrollTop() > goToTopLimit );
					} );
				}
			} else {
				if ( jQuery( "#scroll-to-top" ).hasClass( "watching" ) ) {
					jQuery( "#scroll-to-top" ).removeClass( "watching" );
					jQuery( window ).unbind( "scroll.to-top-katerina" );
				}
			}
		}).trigger( "resize" ).trigger( "scroll" );
	}

	// Handle tab navigation with hash links.
	jQuery( ".block-tabs > ul a" ).on( "click.katerina", function (e) {
		if ( jQuery( this ).hasClass( "is-active" ) ) {
			e.preventDefault();
			return;
		}
		var $target = jQuery( jQuery( this ).attr( "href" ) );
		$target.attr( "data-id", $target.attr( "id" ) ).attr( "id", "" );
	});
	jQuery( window ).on( "hashchange.katerina", function() {
		if ( ! window.location.hash ) {
			return;
		}
		var $active_tab_content = jQuery( '.block-tab-content[data-id="' + window.location.hash.substring( 1 ) + '"]' );
		if ( 0 === $active_tab_content.length ) {
			return;
		}
		$active_tab_content.attr( "id", $active_tab_content.data( "id" ) );
		var $tab_container = $active_tab_content.parent();
		$tab_container.find( ".block-tab-content:not(#" + $active_tab_content.data( "id" ) + ")" ).removeClass( "is-active" );
		$active_tab_content.addClass( "is-active" );
		$tab_container.find( "> ul a" ).removeClass( "is-active" ).filter( '[href="' + window.location.hash + '"]' ).addClass( "is-active" );
	});
	if ( window.location.hash ) {
		var $active_tab = jQuery( '.block-tabs > ul a[href="' + window.location.hash + '"]' );
		if ( $active_tab.length > 0 ) {
			$active_tab.trigger( "click" );
			jQuery( window ).trigger( "hashchange.katerina" );
		}
	}
	jQuery( ".block-tabs" ).addClass( "loaded" );

	// Handle collapsible elements
	if ( jQuery( ".block-collapse" ).length > 0 ) {
		jQuery( ".block-collapse > a" ).on( "click.katerina", function (e) {
			var $parent = jQuery( this ).parent();
			var $target = jQuery( jQuery( this ).attr( "href" ) );

			e.preventDefault();
			$parent.toggleClass( "is-opened" );
			if ( $parent.hasClass( "is-opened" ) ) {
				$target.css( "max-height", jQuery( $target )[0].scrollHeight + 1 );
				if ( jQuery( this ).parents( ".block-collapses" ).hasClass( "style-accordion" ) ) {
					$parent.siblings( ".is-opened" ).each(function() {
						jQuery( this ).removeClass( "is-opened" );
						jQuery( jQuery( "> a", this ).attr( "href" ) ).css( "max-height", "0" );
					});
				}
			} else {
				$target.css( "max-height", "0" );
			}
		});
		jQuery( window ).on( "resize.update-collapses-katerina", function() {
			updateCollapsibleBoxes();
		});
		updateCollapsibleBoxes();
	}

	function updateCollapsibleBoxes() {
		jQuery( ".block-collapse.is-opened > a" ).each( function () {
			var $target = jQuery( jQuery( this ).attr( "href" ) );
			$target.css( "max-height", jQuery( $target )[0].scrollHeight + 1 );
		});
	}

	// Handle custom video blocks
	jQuery( ".block-video.style-custom .video-playback" ).on( "click.katerina", function (e) {
		var media_id = jQuery( this ).attr( "href" );
		var media = document.getElementById( media_id.substring(1) );
		var $wrapper = jQuery( this ).parent();

		media.wrapper = $wrapper;
		if ( media.paused ) {
			media.play();
		} else {
			media.pause();
		}
		if ( ! $wrapper.hasClass( "init-events" ) ) {
			jQuery( media_id ).on( "play", function( e ) {
				this.wrapper.removeClass( "status-pause" ).addClass( "status-play" ).find( ".video-playback em:first-of-type" ).removeClass( "mdi-replay" ).addClass( "mdi-play" );
			}).on( "pause", function() {
				this.wrapper.removeClass( "status-play" ).addClass( "status-pause" );
			}).on( "timeupdate", function() {
				this.wrapper.find( ".video-playback .progress" ).css( "width", ( this.currentTime / this.duration * 100 ) + "%" );
			}).on( "ended", function() {
				this.wrapper.removeClass( "status-play" ).addClass( "status-pause" ).find( ".video-playback em:first-of-type" ).removeClass( "mdi-play" ).addClass( "mdi-replay" );
				this.wrapper.find( ".video-playback .progress" ).removeAttr( "style" );
			});
			$wrapper.addClass( "init-events" );
		}
		e.preventDefault();
	});

	if ( typeof Fancybox !== "undefined" ) {
		Fancybox.defaults.hideScrollbar = false;
		jQuery( ".single-attachment .attachment a" ).has( "img" ).attr( "data-fancybox", "" );
	}

	// Handle parallax effect when hovering on a specific element
	jQuery( ".parallax-hover, .parallax-hover-children > *" ).on( "mousemove", function( e ) {
		var r;
		if ( screen_has_mouse ) {
			r = this.getBoundingClientRect();
			this.style.setProperty( "--hoverX", e.clientX - ( r.left + Math.floor( r.width / 2 ) ) );
			this.style.setProperty( "--hoverY", e.clientY - ( r.top + Math.floor( r.height / 2 ) ) );
		}
	});

	// Handle parallax effect when hovering on a specific element
	jQuery( ".projects-listing .output-type a" ).on( "click", function( e ) {
		var current_type = jQuery( this ).siblings( ".is-active" ).data( "type" );
		var new_type = jQuery( this ).data( "type" );
		var $listing = jQuery( this ).parents( ".projects-listing" );
		var old_class = $listing.attr( "class" );

		e.preventDefault();
		if ( jQuery( this ).hasClass( "is-active" ) ) {
			return;
		}

		jQuery( this ).addClass( "is-active" ).siblings().removeClass( "is-active" );
		$listing.attr( "class" , old_class.replace(current_type, new_type) + " make-transition" );

		setTimeout(function() {
			$listing.removeClass( "make-transition" );
		}, transitionMiliseconds);
	});

	// Handle project gallery filters
	jQuery( ".projects-listing .output-filter a" ).on( "click.katerina", function (e) {
		e.preventDefault();
		if ( jQuery( this ).hasClass( "is-active" ) ) {
			return;
		}

		jQuery( this ).parents( ".output-filter" ).find( "a" ).removeClass( "is-active" );
		jQuery( this ).addClass( "is-active" );

		var $listing = jQuery( this ).parents( ".projects-listing" );
		var $projects = $listing.find( ".project-entry" );
		var filter = jQuery( this ).data( "filter" );
		$projects.removeClass( "filtered-project" );
		if ( "*" !== filter ) {
			$projects.filter( ':not([data-filter*="' + filter + '"])' ).addClass( "filtered-project" );
		}

		// scroll to first visible project
		var scrollTop = -1;
		if ( $listing.hasClass( "style-justified" ) ) {
			scrollTop = $projects.filter( ":not(.filtered-project)" ).eq(0).offset().top - jQuery( this ).parents( ".output-filter" ).outerHeight();
			if ( $body.hasClass( "navbar-sticky" ) && ! jQuery( "#menu-toggle" ).is( ":visible" ) ) {
				scrollTop -= $top.outerHeight();
			}
		} else {
			scrollTop = $listing.offset().top;
			if ( jQuery( "#menu-toggle" ).is( ":visible" ) ) {
				scrollTop -= jQuery( this ).parents( ".output-filter" ).outerHeight();
			} else {
				scrollTop -= $top.outerHeight();
			}
		}
		if ( scrollTop >= 0) {
			scrollTo( scrollTop, animMiliseconds );
		}
	});

	// toggle visibility of the window and disab le some features while window/tab is inactive (for performance and battery life)
	jQuery( document ).on( "visibilitychange", function (event) {
		$body.toggleClass( "document-is-inactive", document.visibilityState === "hidden" );
	});

	// Handle featured media, be it static image/video or a displacement effect slider
	if ( $featured.length > 0 ) {
		if ( jQuery( "#featured-slider.type-image > img" ).length === 1 ) {
			jQuery( "#featured-slider > img" ).imgHasLoaded( function() {
				$body.addClass( "featured-media-loaded" );
			});
		} else if ( jQuery( "#featured-slider.type-video > video" ).length === 1 ) {
			jQuery( "#featured-slider video" ).on( "loadeddata", function() {
				$body.addClass( "featured-media-loaded" );
			}).on( "error", function() {
				$body.addClass( "featured-media-loaded" );
			});
			if ( jQuery( "#featured-slider video" )[0].readyState >= 3 ) {
				$body.addClass( "featured-media-loaded featured-media-error" );
			}
		} else if ( jQuery( "#featured-slider.type-iframe > iframe" ).length === 1 ) {
			jQuery( "#featured-slider iframe" ).on( "load", function() {
				$body.addClass( "featured-media-loaded" );
			});
		} else if ( jQuery( "#featured-slider.type-displacement > .slide.is-active" ).length > 0 ) {
			jQuery( "#featured-slider .slide.is-active > img" ).imgHasLoaded( function() {
				if ( $.fn.displacementSlider ) {
					jQuery( "#featured-slider" ).displacementSlider();
				}
				$body.addClass( "featured-media-loaded" );
			});
		} else {
			// handle user custom solution
			$body.addClass( "featured-media-loaded" );
		}

		var featuredVisibilityState = true;
		function checkSliderVisibility() {
			var newState = $featured.isInViewport();
			if ( newState !== featuredVisibilityState ) {
				$body.toggleClass( "featured-media-hidden", ! newState );
				if ( jQuery( "#featured-slider.type-video > video[autoplay]" ).length === 1 ) {
					if ( newState ) {
						jQuery( "#featured-slider video" )[0].play();
					} else {
						jQuery( "#featured-slider video" )[0].pause();
					}
				}
			}
			featuredVisibilityState = newState;
		}

		// Determine if sub-menus are showed above or below the top header
		submenuTopLimit = $featured.outerHeight() / 2;
		jQuery( window ).on( "resize.submenu-katerina", function() {
			if ( window.innerWidth >= 992 ) {
				submenuTopLimit = $featured.outerHeight() / 2;
			}
			checkSliderVisibility();
		});
		jQuery( window ).on( "scroll.submenu-katerina", function() {
			$body.toggleClass( "submenu-above", jQuery( window ).scrollTop() < submenuTopLimit );
			checkSliderVisibility();
		}).trigger( "scroll" );
	}
});

window.requestAnimFrame = (function() {
	return  window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame    ||
		window.oRequestAnimationFrame      ||
		window.msRequestAnimationFrame     ||
		function( callback ){
			window.setTimeout(callback, 1000 / 60);
		};
})();

(function($){
	$.fn.imgHasLoaded = function( callback ) {
		return this.each(function() {
			if ( this.complete && this.naturalWidth ) {
				callback.apply(this);
			} else {
				$(this).on( "load", function() {
					callback.apply(this);
				});
			}
		});
	};

	$.fn.isInViewport = function() {
		var elementTop = $(this).offset().top;
		var elementBottom = elementTop + $(this).outerHeight();
		var viewportTop = $(window).scrollTop();
		var viewportBottom = viewportTop + window.innerHeight;
		return elementBottom > viewportTop && elementTop < viewportBottom;
	};
})(jQuery);
