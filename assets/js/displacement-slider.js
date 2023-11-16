// displacement slider effect v0.1 - Liviu Cerchez
(function ( $ ) { "use strict";
	$.fn.displacementSlider = function( options ) {
		var defaults = {
			displacement: '',
			intensity: 0.2,
			angle1: Math.PI / 4, // 45 degrees
			angle2: -Math.PI / 4 * 3,
			transition: 500,
			keyboardnav: true,
			automatic: true,
			automatic_speed: 8000,
			automatic_initial_delay: 2500,
			hoverpause: true,
			touchnav: true,
			touch_threshold_horizontal: 150, //min distance traveled to be considered swipe (horizontal)
			touch_threshold_vertical: 100, //min distance traveled to be considered swipe (vertical)
			touch_allowed_time: 500, // maximum time allowed to travel that distance
			slideContent: '.slide-content',
			featuredTarget: '#featured-media .featured-text .wrapper'
		};
		var settings = $.extend({}, defaults, options, this.data());

		var slides_count = this.find( "> .slide" ).length;
		if ( slides_count < 2 ) { // restrict to multiple slides
			return;
		}

		var $slider = this;
		var slider = $slider[0];
		var $controls = $slider.next( ".featured-slider-controls" );
		var current_slide = 0;
		var next_slide = current_slide + 1;
		var prev_slide = ( current_slide === 0 ) ? slides_count - 1 : current_slide - 1;
		var initial_delay_timer;

		var scene = new THREE.Scene();
		var camera = new THREE.OrthographicCamera(slider.offsetWidth / -2, slider.offsetWidth / 2, slider.offsetHeight / 2, slider.offsetHeight / -2, 1, 1000);
		camera.position.set(0, 0, 1);
		var renderer = new THREE.WebGLRenderer({
			antialias: false,
			alpha: true
		});
		renderer.setPixelRatio(2.0);
		renderer.setClearColor(0xffffff, 0.0);
		renderer.setSize(slider.offsetWidth, slider.offsetHeight);

		slider.appendChild(renderer.domElement);

		var render = function () {
			renderer.render(scene, camera);
		};

		var loader = new THREE.TextureLoader();
		loader.crossOrigin = "";

		var disp = loader.load(settings.displacement, render);
		disp.magFilter = disp.minFilter = THREE.LinearFilter;
		var texture1;
		var texture2;

		THREE.DefaultLoadingManager.onError = function ( url ) {
			if ( url === settings.displacement && window.location.protocol === "file:" ) {
				console.log( "Due to browsers' same origin policy security restrictions, loading from a file system may fail with a security exception. Also, check if the displacement image path is valid. Read more: https://threejs.org/docs/?q=loca#manual/en/introduction/How-to-run-things-locally" );
				$slider.removeClass( "loaded" ).addClass( "error" );
			}
		};

		var $current_slide = jQuery( ".slide", $slider ).eq( current_slide );
		var $current_slide_elem = $current_slide.find( "img" );
		texture1 = loader.load( $current_slide_elem.attr("src"), render );
		texture1.magFilter = texture1.minFilter = THREE.LinearFilter;

		var a1, a2, aspectRatio;

		function updateAspectRatio() {
			aspectRatio = $current_slide_elem.attr( "height" ) / $current_slide_elem.attr( "width" );
			if (slider.offsetHeight / slider.offsetWidth < aspectRatio) {
				a1 = 1;
				a2 = slider.offsetHeight / slider.offsetWidth / aspectRatio;
			} else {
				a1 = slider.offsetWidth / slider.offsetHeight * aspectRatio;
				a2 = 1;
			}
		}
		updateAspectRatio();

		var vertex = "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );}";
		var fragment = "varying vec2 vUv; uniform float dispFactor; uniform float dpr; uniform sampler2D disp; uniform sampler2D texture1; uniform sampler2D texture2; uniform float angle1; uniform float angle2; uniform float intensity1; uniform float intensity2; uniform vec4 res; uniform vec2 parent; mat2 getRotM(float angle) { float s = sin(angle); float c = cos(angle); return mat2(c, -s, s, c);} void main() { vec4 disp = texture2D(disp, vUv); vec2 dispVec = vec2(disp.r, disp.g); vec2 uv = 0.5 * gl_FragCoord.xy / (res.xy) ; vec2 myUV = (uv - vec2(0.5))*res.zw + vec2(0.5); vec2 distortedPosition1 = myUV + getRotM(angle1) * dispVec * intensity1 * dispFactor; vec2 distortedPosition2 = myUV + getRotM(angle2) * dispVec * intensity2 * (1.0 - dispFactor); vec4 _texture1 = texture2D(texture1, distortedPosition1); vec4 _texture2 = texture2D(texture2, distortedPosition2); gl_FragColor = mix(_texture1, _texture2, dispFactor);}";

		var mat = new THREE.ShaderMaterial({
			uniforms: {
				intensity1: {
					type: 'f',
					value: settings.intensity
				},
				intensity2: {
					type: 'f',
					value: settings.intensity
				},
				dispFactor: {
					type: 'f',
					value: 0.0
				},
				angle1: {
					type: 'f',
					value: settings.angle1
				},
				angle2: {
					type: 'f',
					value: settings.angle2
				},
				texture1: {
					type: 't',
					value: texture1
				},
				texture2: {
					type: 't',
					value: texture2
				},
				disp: {
					type: 't',
					value: disp
				},
				res: {
					type: 'vec4',
					value: new THREE.Vector4(slider.offsetWidth, slider.offsetHeight, a1, a2)
				},
				dpr: {
					type: 'f',
					value: window.devicePixelRatio
				}
			},
			vertexShader: vertex,
			fragmentShader: fragment,
			transparent: true,
			opacity: 1.0
		});
		var geometry = new THREE.PlaneBufferGeometry(slider.offsetWidth, slider.offsetHeight, 1);
		var object = new THREE.Mesh(geometry, mat);
		scene.add(object);

		jQuery( window ).on( "resize.displacement-slider", function() {
			updateAspectRatio();
			object.material.uniforms.res.value = new THREE.Vector4(slider.offsetWidth, slider.offsetHeight, a1, a2);
			renderer.setSize(slider.offsetWidth, slider.offsetHeight);
			render();
		});

		// Smooth animating of two values using requestAnimationFrame
		var animTimers = [];

		function inOutQuad(n){
			n *= 2;
			if (n < 1) return 0.5 * n * n;
			return - 0.5 * (--n * (n - 2) - 1);
		}

		function animValue( uniqueId, startValue, endValue, animDuration, animEase, update, finish ) {
			var start = null;
			var end   = null;

			function startAnim( timeStamp ) {
				start = timeStamp;
				end = start + animDuration;
				tick(timeStamp);
			}

			function tick( now ) {
				var p = (now - start) / animDuration;
				if ( p >= 1 ) {
					update( endValue );
					finish();
					return;
				}
				update( startValue + ( endValue - startValue ) * animEase( p ) );
				animTimers[ uniqueId ] = window.requestAnimFrame( tick );
			}
			animTimers[ uniqueId ] = window.requestAnimFrame( startAnim );
		}

		function goto_next_slide() {
			var $next_slide = jQuery( ".slide", $slider ).eq( next_slide );
			var $next_slide_elem = $next_slide.find( "img" );
			$controls.addClass( "animating" );
			jQuery( settings.featuredTarget ).addClass( "begin-animating begin-animating-right" ).removeClass( "end-animating end-animating-left end-animating-right" );
			$next_slide_elem.imgHasLoaded( function() {
				texture2 = loader.load( $next_slide_elem.attr( "src" ), render );
				texture2.magFilter = texture2.minFilter = THREE.LinearFilter;
				object.material.uniforms.texture2.value = texture2;
				animValue( "next-slide", 0, 1, settings.transition, inOutQuad,
					function(val) {
						object.material.uniforms.dispFactor.value = val;
						render();
					},
					function() {
						current_slide = next_slide;
						next_slide = ( current_slide === slides_count - 1 ) ? 0 : current_slide + 1;
						prev_slide = ( current_slide === 0 ) ? slides_count - 1 : current_slide - 1;
						$current_slide = $next_slide;
						$current_slide_elem = $next_slide_elem;
						texture1.dispose();
						texture1 = texture2;
						object.material.uniforms.texture1.value = texture1;
						object.material.uniforms.dispFactor.value = 0;
						render();
						$controls.removeClass( "animating" );
						jQuery( settings.featuredTarget ).addClass( "end-animating end-animating-right" ).removeClass( "begin-animating begin-animating-right" ).html( $current_slide.find( settings.slideContent ).html() );
						$current_slide.addClass( "is-active" ).siblings().removeClass( "is-active" );
						if ( settings.automatic ) {
							start_automatic();
						}
					}
				);
			});
		}

		function goto_prev_slide() {
			var $prev_slide = jQuery( ".slide", $slider ).eq( prev_slide );
			var $prev_slide_elem = $prev_slide.find( "img" );
			$controls.addClass( "animating" );
			jQuery( settings.featuredTarget ).addClass( "begin-animating begin-animating-left" ).removeClass( "end-animating end-animating-left end-animating-right" );
			$prev_slide_elem.imgHasLoaded( function() {
				texture2 = texture1;
				texture1 = loader.load( $prev_slide_elem.attr( "src" ), render );
				texture1.magFilter = texture1.minFilter = THREE.LinearFilter;
				object.material.uniforms.texture1.value = texture1;
				object.material.uniforms.texture2.value = texture2;
				object.material.uniforms.dispFactor.value = 1;
				animValue( "prev-slide", 0, 1, settings.transition, inOutQuad,
					function(val) {
						mat.uniforms.dispFactor.value = (1 - val);
						render();
					},
					function() {
						next_slide = current_slide;
						current_slide = prev_slide;
						prev_slide = ( current_slide === 0 ) ? slides_count - 1 : current_slide - 1;
						$current_slide = $prev_slide;
						$current_slide_elem = $prev_slide_elem;
						texture2.dispose();
						render();
						$controls.removeClass( "animating" );
						jQuery( settings.featuredTarget ).addClass( "end-animating end-animating-left" ).removeClass( "begin-animating begin-animating-left" ).html( $current_slide.find( settings.slideContent ).html() );
						$current_slide.addClass( "is-active" ).siblings().removeClass( "is-active" );
					}
				);
			});
		}

		jQuery( ".next", $controls ).on( "click.displacement-slider", function(e) {
			e.preventDefault();
			if ( $controls.hasClass( "animating" ) ) {
				return;
			}
			cancel_automatic();
			goto_next_slide();
		});

		jQuery( ".prev", $controls ).on( "click.displacement-slider", function(e) {
			e.preventDefault();
			if ( $controls.hasClass( "animating" ) ) {
				return;
			}
			cancel_automatic();
			goto_prev_slide();
		});

		function cancel_automatic() {
			if ( settings.automatic ) {
				clearTimeout( initial_delay_timer );
				cancelAnimationFrame( animTimers["automatic"] );
				jQuery( ".progress", $controls ).css( "width", "0px" );
				settings.automatic = false;
			}
		}

		function start_automatic() {
			if ( settings.automatic ) {
				var from = jQuery( ".progress", $controls ).width() / $controls.width() * 100;
				animValue( "automatic", from, 100, settings.automatic_speed - ( settings.automatic_speed * from / 100 ),
					function ( val ) {
						return val;
					},
					function( val ) {
						jQuery( ".progress", $controls ).css( "width", val + "%" );
					},
					function() {
						goto_next_slide();
						jQuery( ".progress", $controls ).css( "width", "0px" );
					}
				);
			}
		}

		if ( settings.touchnav ) {
			var touchX;
			var touchY;
			var dist;
			var elapsedTime;
			var startTime;

			$slider.parent().on( "touchstart.displacement-slider", function (e) {
				var touchobj = e.changedTouches[0];
				dist = 0;
				touchX = touchobj.pageX;
				touchY = touchobj.pageY;
				startTime = new Date().getTime(); // record time when finger first makes contact with surface
			}).on( "touchend.displacement-slider", function(e) {
				var touchobj = e.changedTouches[0];
				dist = touchobj.pageX - touchX; // get total dist traveled by finger while in contact with surface
				elapsedTime = new Date().getTime() - startTime;
				if ( elapsedTime <= settings.touch_allowed_time && Math.abs(dist) >= settings.touch_threshold_horizontal && Math.abs( touchobj.pageY - touchY ) <= settings.touch_threshold_vertical ) {
					if ( dist > 0 ) {
						jQuery( ".prev", $controls ).triggerHandler( "click" );
					} else {
						jQuery( ".next", $controls ).triggerHandler( "click" );
					}
				}
			});
		}

		if ( settings.keyboardnav ) {
			jQuery( document ).on( "keydown.displacement-slider", function (ev) {
				if ( $controls.hasClass( "animating" ) ) {
					return;
				}
				if ( ev.keyCode === 39 ) {
					cancel_automatic();
					goto_next_slide();
				} else if ( ev.keyCode === 37 ) {
					cancel_automatic();
					goto_prev_slide();
				}
			});
		}

		if ( settings.automatic ) {
			initial_delay_timer = setTimeout( function() {
				start_automatic();
			}, settings.automatic_initial_delay );

			if ( settings.hoverpause ) {
				var initial_move = false;
				$slider.parent().on( "mousemove.displacement-slider", function(e) {
					if ( ! initial_move ) {
						initial_move = true;
						clearTimeout( initial_delay_timer );
						cancelAnimationFrame( animTimers["automatic"] );
					}
				}).on( "mouseenter.displacement-slider", function(e) {
					if ( settings.automatic ) {
						cancelAnimationFrame( animTimers["automatic"] );
					}
				}).on( "mouseleave.displacement-slider", function(e) {
					if ( settings.automatic ) {
						start_automatic();
					}
				});
			}

			jQuery( document ).on( "visibilitychange.displacement-slider", function (event) {
				if (document.visibilityState === "hidden") {
					cancelAnimationFrame( animTimers["automatic"] );
				} else {
					if ( settings.automatic ) {
						start_automatic();
					}
				}
			});

			var sliderVisibilityState = true;
			function checkSliderVisibility() {
				var newState = $slider.isInViewport();
				if ( newState !== sliderVisibilityState ) {
					if ( false === newState ) {
						clearTimeout( initial_delay_timer );
						cancelAnimationFrame( animTimers["automatic"] );
					} else {
						if ( settings.automatic ) {
							start_automatic();
						}
					}
				}
				sliderVisibilityState = newState;
			}
			jQuery( window ).on( "scroll.displacement-slider resize.displacement-slider", function() {
				checkSliderVisibility();
			});
			checkSliderVisibility();
		}

		this.addClass( "loaded" );
		return this;
	};
}( jQuery ));
