/*!
 * Kickstarter.js
 * @author Michael Lefebvre <mlefebvre@ultranoir.com>
 * @license New BSD License <http://creativecommons.org/licenses/BSD/>
 *
 *                                     ,-~ |
 *        ________________          o==]___|
 *       |                |            \ \
 *       |________________|            /\ \
 *  __  /  _,-----._      )           |  \ \.
 * |_||/_-~         `.   /()          |  /|]_|_____
 *   |//     (UN)     \ |              \/ /_-~     ~-_
 *   //________________||              / //___________\
 *  //__|______________| \____________/ //___/-\ \~-_
 * ((_________________/_-o___________/_//___/  /\,\  \
 *  |__/(  ((====)o===--~~                 (  ( (o/)  )
 *       \  ``==' /                         \  `--'  /
 *        `-.__,-'                           `-.__,-'
 *
 */

;(function (window, undefined) {
    "use strict";

    // Prepare our Variables
    var History     = window.History,
        document    = window.document,
        $           = window.jQuery,

        // Default object properties
        // will be merge && extends
        // with project needs
        defaults = {
            $window   : $(window),     // prefix jQuery object by $
            $document : $(document),
            RootUrl   : null,
            lang      : [],
            ajax      : {
                htmlMethod      : 'html',
                opacity         : 0,
                durationFadeIn  : 400,
                durationFadeOut : 400,
                loading         : 'loading',
                query           : false      // get params to append to URL on every request
            }
        },

        // Allowed devices
        devices    = ['desktop', 'tablet', 'mobile'],

        // current active controller
        controller = '',

        // project namespace
        ns,

        // vendor prefix
        prefix,

        // Toolsbox
        kickstarter = function ()
        {
            this.VERSION      = '0.3.84'; // Current version of the library
            this.channels     = {};       // mediator channels
            this.tokenFactory = 0;        // mediator token inc reference

            this.device       = {
                desktop : true,
                tablet  : false,
                mobile  : false
            };

            this.viewport     = {
                height  : null,
                width   : null
            };

            // map the right event name
            this.hasTouch = 'ontouchstart' in window;

            this.ev       = {
                start : this.hasTouch ? 'touchstart' : 'mousedown',
                hover : this.hasTouch ? 'touchstart' : 'mouseover',
                move  : this.hasTouch ? 'touchmove'  : 'mousemove',
                end   : this.hasTouch ? 'touchend'   : 'mouseup'
            };
        }

      // mediator

    kickstarter.prototype.subscribe = function (channel, subscription)
    {
        if ( !this.channels[channel] ) this.channels[channel] = [];

        var token = ('tkn' + ++this.tokenFactory);

        this.channels[channel].push({
            func:  subscription,
            token: token
        });

        return token;
    };

    kickstarter.prototype.unsubscribe = function (channel, token)
    {
        if ( !this.channels[channel] ) return;

        if(typeof token === 'undefined')
        {
            delete this.channels[channel];
            return;
        }

        for (var i = -1, l = this.channels[channel].length; ++i < l;)
        {
            if(this.channels[channel][i].token == token)
            {
                this.channels[channel].splice(i, 1);
                return;
            }
        }
    };

    kickstarter.prototype.publish = function (channel)
    {
        if ( !this.channels[channel] ) return;

        var args = [].slice.call(arguments, 1);

        for (var i = -1, l = this.channels[channel].length; ++i < l;)
        {
            this.channels[ channel ][ i ].func.apply(this, args);
        }
    };

        // Markup-based unobtrusive comprehensive DOM-ready execution

    kickstarter.prototype.fire = function (func, funcname, args)
    {
        funcname = (typeof funcname === 'undefined') ? 'init' : funcname;

        if (func !== '' && ns[func] && typeof ns[func][funcname] == 'function')
        {
            ns[func][funcname](args);
        }

    };

    kickstarter.prototype.loadEvents = function ()
    {
        var _body   = document.body,
        _controller = _body.getAttribute('data-controller'),
        _method     = _body.getAttribute('data-method');

        // hit up common first.
        this.fire('core');
        this.fire(_controller);
        this.fire(_controller, _method);
        this.fire('core','finalize');

        if( _controller != '' )
            this.controller = _controller;
    };

        // vendor prefix

    kickstarter.prototype.getPrefix = function ()
    {
        console.log(prefix)
        if( typeof prefix == 'undefined' )
        {
            var styles = window.getComputedStyle(document.documentElement, '')
              , pre = (Array.prototype.slice
                          .call(styles)
                          .join('')
                          .match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
                        )[1]
              , dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];

            prefix = {
                        dom:       dom,
                        lowercase: pre,
                        css:       '-' + pre + '-',
                        js:        pre[0].toUpperCase() + pre.substr(1)
                    };
        }

        return prefix;
    };

        // viewport + device

    kickstarter.prototype.getViewport = function ( property )
    {
        if( typeof property !== 'undefined' && this.viewport[ property ] )
            return this.viewport[ property ];

        return this.viewport;
    };

    kickstarter.prototype.isDesktop = function ()
    {
        return this.device.desktop;
    };

    kickstarter.prototype.isTablet = function ()
    {
        return this.device.tablet;
    };

    kickstarter.prototype.isMobile = function ()
    {
        return this.device.mobile;
    };

    kickstarter.prototype.setDevice = function ( device )
    {
        // if device value not allowed
        if( $.inArray( device, devices) === -1)
            return false;

        for( var d in this.device)
        {
            this.device[ d ] = ( d === device );
        }

        return this.device;
    };

        // Useful

    // Useful for implementing behavior that should
    // only happen after the input has stopped arriving.
    // http://underscorejs.org/#debounce
    kickstarter.prototype.debounce = function(func, wait)
    {
        var timeout;
        return function()
        {
            var context = this, args = arguments;
            var later = function() {
                timeout = null;
                func.apply(context, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };


    kickstarter.prototype.killbounce = function(_func, _wait)
    {
        var
            wheel           =   0
        ,   oldDate         =   new Date()
        ,   scrollPos       =   0
        ;
        return function() {

            var
                context         =   this
            ,   args            =   arguments
            ,   event           =   args[0]
            ,   getDeltaY       =   event.deltaY
            ,   newDate         =   new Date()
            ,   newTime         =   newDate.getTime()
            ,   oldTime         =   oldDate.getTime()
            ,   scrollAllowed   =   true
            ;

            if( wheel < 10 && (newTime-oldTime) < _wait ) {
                scrollPos -= getDeltaY*(10-wheel);
                wheel++;
            }
            else {
                if( (newTime-oldTime) > _wait ) {
                    wheel = 0;
                    scrollPos -= getDeltaY*60;
                }
                else {
                    scrollAllowed = false;
                }
            }
            oldDate = new Date();
            if( scrollAllowed ) {
                _func.apply(context, args);
            }
        }
    };

    // https://github.com/documentcloud/underscore/issues/88
    kickstarter.prototype.deepMerge = function(target, source)
    {
        for (var key in source)
        {
            var original = target[ key ],
                next     = source[ key ];

            if (original && next && typeof next == 'object')
            {
                this.deepMerge( original, next );
            }
            else
            {
                target[key] = next;
            }
        }

        return target;
    };

        // set our project namespace
    kickstarter.prototype.bootstrap = function ( namespace, options )
    {
        // save previous version of this object if exists
        var obj  = typeof window[ namespace ] === 'undefined' ? {} : window[ namespace ],
        // deep merge defaults options with project options
            conf = this.deepMerge(defaults, options || {});

        // expose project namespace to the global object
        window[ namespace ] = ns = $.extend({}, obj, conf);

        ns.rootUrl = this.getRootUrl();

        // wait for DOM ready
        $(function()
        {
            window.kickstarter.loadEvents()
        });

        var self = this;

        ns.$window
            .on('resize', function( event )
            {
                // update viewport
                self.viewport.width  = ns.$window.width();
                self.viewport.height = ns.$window.height();

                // publish jQuery event + viewport
                self.publish('window::resize', event, self.viewport );
            })
            .trigger('resize');
    };

    kickstarter.prototype.getUrl = function ()
    {
        if( !History.enabled )
        {
            return document.location.href;
        }
        else
        {
            return History.getState().url;
        }
    };

        // History JS method
    kickstarter.prototype.getRootUrl = function ()
    {
        // Create
        var rootUrl = document.location.protocol+'//'+(document.location.hostname||document.location.host);
        if ( document.location.port||false )
        {
            rootUrl += ':'+document.location.port;
        }
        rootUrl += '/';

        // Return
        return rootUrl;
    };

    kickstarter.prototype.getRelativeUrl = function ()
    {
        var url = this.getUrl();

        return url.replace(ns.rootUrl,'');
    };

    // expose a kickstarter instance
    // to the global object
    window.kickstarter = new kickstarter();

    // public access to the prototype
    // allow to extend/override method
    window.kickstarter.ext = kickstarter.prototype;

    ////// FLUX ////////////////////////////////////////////

    // Check to see if History.js is enabled for our Browser
    if( typeof History == 'undefined' ||  !History.enabled )
    {
        return;
    }

    var
        hasRouterLib    = (typeof Router != 'undefined')?true:false
    ;
    if(!hasRouterLib)
    {
        // Wait for Document
        $(function ()
        {
            // Application Generic Variables
            var
                rootUrl    = History.getRootUrl(),
                $body      = $(document.body),
                $pageTop   = $('html, body'),
                $content   = $('div[role="xhr-receptor"]'),
                _k         = window.kickstarter;

            // Internal Helper
            $.expr[':'].internal = function (obj, index, meta, stack)
            {
                // Prepare
                var url = $(obj).attr('href') || '';

                return url.substring(0,rootUrl.length) === rootUrl || url.indexOf(':') === -1;
            };

            // Ajaxify Helper
            $.fn.ajaxify = function ()
            {
                // Prepare
                var $this = $(this);

                // Ajaxify
                $this.find('a:internal:not([data-bypass])').click(function (event)
                {
                    // Continue as normal for cmd clicks etc
                    if ( event.which == 2 || event.metaKey ) { return true; }

                    if(canAjax) History.pushState(null, ns.ajax.loading, this.href);



                    return false;
                });

                // Chain
                return $this;
            };

            $body.ajaxify();

            // Hook into State Changes
            $(window).bind('statechange', function ()
            {
                // Prepare Variables
                var State       = History.getState(),
                    url         = State.url,
                    relativeUrl = url.replace(rootUrl,'');

                // check if there is no params before
                // add another
                if( ns.ajax.query )
                {
                    var joint = ( url.indexOf('?') != -1 ) ? '?' : '&';
                    url += joint + ns.ajax.query;
                }

                if(typeof State.data.noEvent != "undefined" && State.data.noEvent == true)
                {
                    return false;
                }

                // BEFORE

                if(canAjax)
                {
                    _k.publish('statechange::before');

                    var jqxhr = $.ajax({
                        url: url,
                        dataType: "html",
                    });
                    jqxhr.done(function(_json) {
                        // AFTER
                        _k.publish('statechange::after', _json);
                        // Inform Google Analytics of the change
                        if ( typeof window._gaq !== 'undefined' )
                        {
                            window._gaq.push(['_trackPageview']);
                        }
                        if (typeof window.ga !== 'undefined')
                        {
                            ga('send', 'pageview', {'page': url});
                        }
                    });
                    jqxhr.fail(function(jqXHR, textStatus, errorThrown) {
                        document.location.href = url;
                        return false;
                    });

                }

            }); // end onStateChange

        }); // end onDomLoad
    }


})(window); // end closure

/* UTILS
----------------------- */

// Shorthand jQuery selector cache.
// Only use on selectors for the DOM that won't change.
var $$ = (function ()
{
    var cache = {};
    return function (selector)
    {
        if (!cache[selector])
        {
            cache[selector] = $(selector);
        }
        return cache[selector];
    };
})();

// In case we forget to take out console statements.
// IE becomes very unhappy when we forget. Let's not make IE unhappy
if(typeof(console) === 'undefined')
{
    var console = {}
    console.log = console.error = console.info = console.debug = console.warn = console.trace = console.dir = console.dirxml = console.group = console.groupEnd = console.time = console.timeEnd = console.assert = console.profile = function () {};
}