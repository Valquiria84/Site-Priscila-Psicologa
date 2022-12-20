/***********************************************************************
*
*  Coda Slider 3
*  Kevin Batdorf
*
*  http://kevinbatdorf.github.com/codaslider
*
*  GPL license & MIT license
*
************************************************************************/

// Utility for creating objects in older browsers
if ( typeof Object.create !== 'function' ) {
	Object.create = function( obj ) {
		function F() {}
		F.prototype = obj;
		return new F();
	};
}

(function( $, window, document, undefined ) {
	var Slider = {
		//initialize
		init: function( options, elem ) {
			var self = this;

			//remove no JavaScript warning
			$("body").removeClass("coda-slider-no-js");

			//add preloader class (backwards compatible)
			$('.coda-slider').prepend('<p class="loading">Loading...<br /><img src="./img/ajax-loader.gif" width="220" height="19" alt="loading..." /></p>');

			// Cache the element
			self.elem = elem;
			self.$elem = $( elem );

			// Cache the ID and class. This allows for multiple instances with any ID name supplied
			self.sliderId = '#' + ( self.$elem ).attr('id');
			
			// Set the options
			self.options = $.extend( {}, $.fn.codaSlider.options, options );
			
			// Cache the ID and class. This allows for multiple instances with any ID name supplied
			self.sliderId = '#' + ( self.$elem ).attr('id');
			
			// Build the tabs and navigation
			self.build();

			// Start auto slider
			if (self.options.autoSlide) {self.autoSlide();}

			self.events();

			// Test the preloader (image doesn't load)
			//alert("Testing preloader");

			// Kill the preloader
			$("p.loading").remove();

		},
		build: function() {
			var self = this;

			// Wrap the entire slider (backwards compatible)
			if ( $(self.sliderId).parent().attr('class') != 'coda-slider-wrapper' ) {$(self.sliderId).wrap('<div id="' + ( self.$elem ).attr('id') + '-wrapper" class="coda-slider-wrapper"></div>'); }
			
			// Add the .panel class to the individual panels (backwards compatable)
			$(self.sliderId + " > div").addClass('panel');
			self.panelClass = self.sliderId + ' .panel';
			// Wrap all panels in a div, and wrap inner content in a div (backwards compatible)
			$(self.panelClass).wrapAll('<div class="panel-container"></div>');
			if ( $(self.panelClass).children().attr('class') != 'panel-wrapper' ) { $(self.panelClass).wrapInner('<div class="panel-wrapper"></div>'); }
			self.panelContainer = ($(self.panelClass).parent());

			// Store hash Links
			if (self.options.hashLinking) {
				self.hash = (window.location.hash);
				self.hashPanel = (self.hash).replace('#', '');
			}

			// Store current tab
			self.currentTab = (self.options.hashLinking && self.hash) ? self.hashPanel - 1 : self.options.firstPanelToLoad - 1;

			// Apply starting height to the container
			if (self.options.autoHeight) { $(self.sliderId).css('height', $($(self.panelContainer).children()[self.currentTab]).height() + $(self.sliderId + '-wrapper .coda-nav-right').height());	}

			// Build navigation tabs
			if (self.options.dynamicTabs) { self.addNavigation(); }

			// Build navigation arrows
			if (self.options.dynamicArrows) { self.addArrows(); }

			// Create a container width to allow for a smooth float right.
			self.totalSliderWidth = $(self.sliderId).outerWidth(true) + $($(self.sliderId).parent()).children('[class^=coda-nav-left]').outerWidth(true) + $($(self.sliderId).parent()).children('[class^=coda-nav-right]').outerWidth(true);
			$($(self.sliderId).parent()).css('width', self.totalSliderWidth);

			// Align navigation tabs
			if (self.options.dynamicTabs) { self.alignNavigation(); }

			// Clone panels if continuous is enabled
			if (self.options.continuous) {
				$(self.panelContainer).prepend($(self.panelContainer).children().last().clone());
				$(self.panelContainer).append($(self.panelContainer).children().eq(1).clone());
			}

			// Allow the slider to be clicked
			self.clickable = true;

			// Count the number of panels and get the combined width
			self.panelCount = $(self.panelClass).length;
			self.panelWidth = $(self.panelClass).outerWidth();
			self.totalWidth = self.panelCount * self.panelWidth;
			
			// Variable for the % sign if needed (responsive), otherwise px
			self.pSign = 'px';

			self.slideWidth = $(self.sliderId).width();

			// Puts the margin at the starting point with no animation. Made for both continuous and firstPanelToLoad features.
			// ~~(self.options.continuous) will equal 1 if true, otherwise 0
			$(self.panelContainer).css('margin-left', ( -self.slideWidth * ~~(self.options.continuous)) + (-self.slideWidth * self.currentTab) );

			// Configure the current tab
			self.setCurrent(self.currentTab);

			// Apply the width to the panel container
			$(self.sliderId + ' .panel-container').css('width', self.totalWidth);

		},

		addNavigation: function(){
			var self = this;
			// The id is assigned here to allow for the responsive setting
			var dynamicTabs = '<div class="coda-nav"><ul></ul></div>';

			// Add basic frame
			if (self.options.dynamicTabsPosition === 'bottom') { $(self.sliderId).after(dynamicTabs); }
			else{ $(self.sliderId).before(dynamicTabs); }

			// Add labels
			$.each(
				(self.$elem).find(self.options.panelTitleSelector), function(n) {
					$($(self.sliderId).parent()).find('.coda-nav ul').append('<li class="tab' + (n+1) + '"><a href="#' + (n+1) + '" title="' + $(this).text() + '">' + $(this).text() + '</a></li>');
				}
			);
		},

		alignNavigation: function() {
			var self = this;
			self.totalNavWidth = 0;
			var arrow = '';

			if (self.options.dynamicArrowsGraphical) {arrow = '-arrow';}

			// Set the alignment
			if (self.options.dynamicTabsAlign != 'center') {
				$($(self.sliderId).parent()).find('.coda-nav ul').css(
					'margin-' + self.options.dynamicTabsAlign,
					// Finds the width of the arrows and the margin
						$($(self.sliderId).parent()).find(
							'.coda-nav-' +
							self.options.dynamicTabsAlign +
							arrow
						).outerWidth(true) + parseInt($(self.sliderId).css('margin-'+ self.options.dynamicTabsAlign), 10)
				);
				$($(self.sliderId).parent()).find('.coda-nav ul').css('float', self.options.dynamicTabsAlign); // couldn't combine this .css() with the previous??
			}
			else {
				// Get total width of the navigation tabs and center it
				$($(self.sliderId).parent()).find('.coda-nav li a').each(function(){self.totalNavWidth += $(this).outerWidth(true); });
				$($(self.sliderId).parent()).find('.coda-nav ul').css('width', self.totalNavWidth + 1);
			}
		},

		addArrows: function(){
			var self = this;
			$(self.sliderId).parent().addClass("arrows");
			if(self.options.dynamicArrowsGraphical){
				$(self.sliderId).before('<div class="coda-nav-left-arrow" data-dir="prev" title="Slide left"><a href="#"></a></div>');
				$(self.sliderId).after('<div class="coda-nav-right-arrow" data-dir="next" title="Slide right"><a href="#"></a></div>');
			}
			else{
				$(self.sliderId).before('<div class="coda-nav-left" data-dir="prev" title="Slide left"><a href="#">' + self.options.dynamicArrowLeftText + '</a></div>');
				$(self.sliderId).after('<div class="coda-nav-right" data-dir="next" title="Slide right"><a href="#">' + self.options.dynamicArrowRightText + '</a></div>');
			}
		},

		events: function(){
			var self = this;
			// CLick arrows
			$($(self.sliderId).parent()).find('[class^=coda-nav-]').on('click', function(e){
				// These prevent clicking when in continuous mode, which would break it otherwise.
				if (!self.clickable && self.options.continuous) {return false;}
				self.setCurrent($(this).attr('class').split('-')[2]);
				if (self.options.continuous) {self.clickable = false;}
				return false;
			});
			// Click tabs
			$($(self.sliderId).parent()).find('[class^=coda-nav] li').on('click', function(e){
				if (!self.clickable && self.options.continuous) {return false;}
				self.setCurrent(parseInt( $(this).attr('class').split('tab')[1], 10) - 1 );
				if (self.options.continuous) {self.clickable = false;}
				return false;
			});
			// Click cross links
			$('[data-ref*=' + (self.sliderId).split('#')[1] + ']').on('click', function(e){
				if (!self.clickable && self.options.continuous) {return false;}
				// Stop and Play controls
				if (self.options.autoSlideControls) {
					if ($(this).attr('name') === 'stop') {
						$(this).html(self.options.autoSlideStartText).attr('name', 'start');
						clearTimeout(self.autoslideTimeout);
						return false;
					}
					if ($(this).attr('name') === 'start') {
						$(this).html(self.options.autoSlideStopText).attr('name', 'stop');
						self.setCurrent(self.currentTab + 1);
						self.autoSlide();
						return false;
					}
				}
				self.setCurrent( parseInt( $(this).attr('href').split('#')[1] -1, 10 ) );
				if (self.options.continuous) {self.clickable = false;}
				if (self.options.autoSlideStopWhenClicked) { clearTimeout(self.autoslideTimeout); }
				return false;
			});
			// Click to stop autoslider
			$($(self.sliderId).parent()).find('*').on('click', function(e){
				// AutoSlide controls.
				if (self.options.autoSlideControls && autoSlideStopWhenClicked) {
					$('body').find('[data-ref*=' + (self.sliderId).split('#')[1] + '][name=stop]').html(self.options.autoSlideStartText);
					clearTimeout(self.autoslideTimeout);
				}
				if (!self.clickable && self.options.continuous) {
					if (self.options.autoSlideStopWhenClicked) { clearTimeout(self.autoslideTimeout); }
					return false;
				}
				if (self.options.autoSlide) {
					// Clear the timeout
					if (self.options.autoSlideStopWhenClicked) { clearTimeout(self.autoslideTimeout); }
					else {
						self.autoSlide(clearTimeout(self.autoslideTimeout));
						self.clickable = true;
					}
				}
				// Stops from speedy clicking for continuous sliding.
				if (self.options.continuous) {clearTimeout(self.continuousTimeout);}
			});
		},

		setCurrent: function( direction ){
			var self = this;
			if (self.clickable) {
			
				if (typeof direction == 'number') {	self.currentTab = direction;	}
				else {
					// "left" = -1; "right" = 1;
					self.currentTab += ( ~~( direction === 'right' ) || -1 );
					// If not continuous, slide back at the last or first panel
					if (!self.options.continuous){
						self.currentTab = (self.currentTab < 0) ? this.panelCount - 1 : (self.currentTab % this.panelCount);
					}
				}
				// This is so the height will match the current panel, ignoring the clones.
				// It also adjusts the count for the "currrent" class that's applied
				if (self.options.continuous) {
					self.panelHeightCount = self.currentTab + 1;
					if (self.currentTab === self.panelCount - 2){self.setTab = 0;}
					else if (self.currentTab === -1) {self.setTab = self.panelCount - 3;}
					else {self.setTab = self.currentTab;}
				}
				else{
					self.panelHeightCount = self.currentTab;
					self.setTab = self.currentTab;
				}
				// Add and remove current class.
				$($(self.sliderId).parent()).find('.tab' + (self.setTab + 1) + ' a:first')
					.addClass('current')
					.parent().siblings().children().removeClass('current');

				// Update Hash Tags
				if (self.options.hashLinking) {
					//console.log( ((self.$elem).find(self.options.hashTitleSelector)[self.currentTab] ));
				if (self.options.continuous) {
					if (self.currentTab === self.panelCount - 2) {
						window.location.hash = 1;
					} else if (self.currentTab === -1) {
						window.location.hash = self.panelCount - 2;
					} else {
						window.location.hash = self.currentTab + 1;
					}
				} else { window.location.hash = self.currentTab + 1; }
			}
				
				this.transition();
			}
		},
		
		transition: function(){
			var self = this;
			// Adjust the height
			if (self.options.autoHeight) {
				$(self.panelContainer).parent().animate({
					'height': $($(self.panelContainer).children()[self.panelHeightCount]).height()
				}, {
					easing: self.options.autoHeightEaseFunction,
					duration: self.options.autoHeightEaseDuration,
					queue: false
					});
			}
			
			// Adjust the margin for continuous sliding
			if (self.options.continuous) {self.marginLeft = -(self.currentTab * self.slideWidth ) - self.slideWidth;}
			// Otherwise adjust as normal
			else {self.marginLeft = -(self.currentTab * self.slideWidth ); }
			// Animate the slider
			(self.panelContainer).animate({
				'margin-left': self.marginLeft + self.pSign
			}, {
				easing: self.options.slideEaseFunction,
				duration: self.options.slideEaseDuration,
				queue: false,
				complete: self.continuousSlide(self.options.slideEaseDuration + 50)
			});
		},

		autoSlide: function(){
			var self = this;
			// Can't set the autoslide slower than the easing ;-)
			if (self.options.autoSlideInterval < self.options.slideEaseDuration) {
				self.options.autoSlideInterval = (self.options.slideEaseDuration > self.options.autoHeightEaseDuration) ? self.options.slideEaseDuration : self.options.autoHeightEaseDuration;
			}
			if (self.options.continuous) {self.clickable = false;}
			self.autoslideTimeout = setTimeout(function() {
				// Slide left or right
				self.setCurrent( self.options.autoSliderDirection );
				self.autoSlide();

			}, self.options.autoSlideInterval);
		},

		continuousSlide: function (delay){
			var self = this;

			if (self.options.continuous) {
				self.continuousTimeout = setTimeout(function() {

					// If on the last panel (the clone of panel 1), set the margin to the original.
					if (self.currentTab === self.panelCount - 2){
						$(self.panelContainer).css('margin-left', -self.slideWidth + self.pSign);
						self.currentTab = 0;
					}
					// If on the first panel the clone of the last panel), set the margin to the original.
					else if (self.currentTab === -1){
						$(self.panelContainer).css('margin-left', -( ((self.slideWidth * self.panelCount) - (self.slideWidth * 2))) + self.pSign );
						self.currentTab = (self.panelCount - 3);
					}
					self.clickable = true;
				}, delay);
			}
			else{self.clickable = true;}
		}
	};
	
	$.fn.codaSlider = function( options ) {
		return this.each(function() {
			
			var slider = Object.create( Slider );
			slider.init( options, this );

		});
	};
	
	$.fn.codaSlider.options = {
		autoHeight: true,
		autoHeightEaseDuration: 1500,
		autoHeightEaseFunction: "easeInOutExpo",
		autoSlide: false,
		autoSliderDirection: 'right',
		autoSlideInterval: 70,
		autoSlideControls: false,
		autoSlideStartText: 'Start',
		autoSlideStopText: 'Stop',
		autoSlideStopWhenClicked: true,
		continuous: true,
		crossLinking: true, // No longer used
		dynamicArrows: true,
		dynamicArrowsGraphical: false,
		dynamicArrowLeftText: "&#171;",
		dynamicArrowRightText: "&#187;",
		dynamicTabs: true,
		dynamicTabsAlign: "center",
		dynamicTabsPosition: "top",
		externalTriggerSelector: "a.xtrig", //shouldnt need any more
		firstPanelToLoad: 1,
		hashLinking: false,
		panelTitleSelector: "h2.title",
		slideEaseDuration: 1500,
		slideEaseFunction: "easeInOutExpo"
	};

})( jQuery, window, document );


/*
 * jQuery Easing v1.3 - http://gsgd.co.uk/sandbox/jquery/easing/
 *
 * Uses the built in easing capabilities added In jQuery 1.1
 * to offer multiple easing options
 *
 * TERMS OF USE - jQuery Easing
 * 
 * Open source under the BSD License. 
 * 
 * Copyright © 2008 George McGinley Smith
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, 
 * are permitted provided that the following conditions are met:
 * 
 * Redistributions of source code must retain the above copyright notice, this list of 
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list 
 * of conditions and the following disclaimer in the documentation and/or other materials 
 * provided with the distribution.
 * 
 * Neither the name of the author nor the names of contributors may be used to endorse 
 * or promote products derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED 
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
 * OF THE POSSIBILITY OF SUCH DAMAGE. 
 *
*/

// t: current time, b: begInnIng value, c: change In value, d: duration
jQuery.easing['jswing'] = jQuery.easing['swing'];

jQuery.extend( jQuery.easing,
{
	def: 'easeOutQuad',
	swing: function (x, t, b, c, d) {
		//alert(jQuery.easing.default);
		return jQuery.easing[jQuery.easing.def](x, t, b, c, d);
	},
	easeInQuad: function (x, t, b, c, d) {
		return c*(t/=d)*t + b;
	},
	easeOutQuad: function (x, t, b, c, d) {
		return -c *(t/=d)*(t-2) + b;
	},
	easeInOutQuad: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t + b;
		return -c/2 * ((--t)*(t-2) - 1) + b;
	},
	easeInCubic: function (x, t, b, c, d) {
		return c*(t/=d)*t*t + b;
	},
	easeOutCubic: function (x, t, b, c, d) {
		return c*((t=t/d-1)*t*t + 1) + b;
	},
	easeInOutCubic: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t + b;
		return c/2*((t-=2)*t*t + 2) + b;
	},
	easeInQuart: function (x, t, b, c, d) {
		return c*(t/=d)*t*t*t + b;
	},
	easeOutQuart: function (x, t, b, c, d) {
		return -c * ((t=t/d-1)*t*t*t - 1) + b;
	},
	easeInOutQuart: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
		return -c/2 * ((t-=2)*t*t*t - 2) + b;
	},
	easeInQuint: function (x, t, b, c, d) {
		return c*(t/=d)*t*t*t*t + b;
	},
	easeOutQuint: function (x, t, b, c, d) {
		return c*((t=t/d-1)*t*t*t*t + 1) + b;
	},
	easeInOutQuint: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
		return c/2*((t-=2)*t*t*t*t + 2) + b;
	},
	easeInSine: function (x, t, b, c, d) {
		return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
	},
	easeOutSine: function (x, t, b, c, d) {
		return c * Math.sin(t/d * (Math.PI/2)) + b;
	},
	easeInOutSine: function (x, t, b, c, d) {
		return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
	},
	easeInExpo: function (x, t, b, c, d) {
		return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
	},
	easeOutExpo: function (x, t, b, c, d) {
		return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
	},
	easeInOutExpo: function (x, t, b, c, d) {
		if (t==0) return b;
		if (t==d) return b+c;
		if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
		return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
	},
	easeInCirc: function (x, t, b, c, d) {
		return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
	},
	easeOutCirc: function (x, t, b, c, d) {
		return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
	},
	easeInOutCirc: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
		return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
	},
	easeInElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
	},
	easeOutElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
	},
	easeInOutElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(.3*1.5);
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
		return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
	},
	easeInBack: function (x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		return c*(t/=d)*t*((s+1)*t - s) + b;
	},
	easeOutBack: function (x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
	},
	easeInOutBack: function (x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158; 
		if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
		return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
	},
	easeInBounce: function (x, t, b, c, d) {
		return c - jQuery.easing.easeOutBounce (x, d-t, 0, c, d) + b;
	},
	easeOutBounce: function (x, t, b, c, d) {
		if ((t/=d) < (1/2.75)) {
			return c*(7.5625*t*t) + b;
		} else if (t < (2/2.75)) {
			return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
		} else if (t < (2.5/2.75)) {
			return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
		} else {
			return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
		}
	},
	easeInOutBounce: function (x, t, b, c, d) {
		if (t < d/2) return jQuery.easing.easeInBounce (x, t*2, 0, c, d) * .5 + b;
		return jQuery.easing.easeOutBounce (x, t*2-d, 0, c, d) * .5 + c*.5 + b;
	}
});

/*
 *
 * TERMS OF USE - EASING EQUATIONS
 * 
 * Open source under the BSD License. 
 * 
 * Copyright © 2001 Robert Penner
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, 
 * are permitted provided that the following conditions are met:
 * 
 * Redistributions of source code must retain the above copyright notice, this list of 
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list 
 * of conditions and the following disclaimer in the documentation and/or other materials 
 * provided with the distribution.
 * 
 * Neither the name of the author nor the names of contributors may be used to endorse 
 * or promote products derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED 
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
 * OF THE POSSIBILITY OF SUCH DAMAGE. 
 *
 */