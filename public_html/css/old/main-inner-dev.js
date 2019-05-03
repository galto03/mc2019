(function (window, $, _, moment, tippy, ljs, dbg) {
    "use strict";

    var App = App || undefined;

    var Utils = {
        youtubeObjects: {},

        getDateTimeFormat: function() {
            return "YYYY-MM-DD HH:mm:ss";
        },

        getYouTubePlayer: function(domId) { return this.youtubeObjects[domId]; },
        hasYouTubePlayer: function(domId) { return !_.isUndefined(this.youtubeObjects[domId]); },
        destroyYouTubePlayer: function(domId) {
            if (this.hasYouTubePlayer(domId) && this.getYouTubePlayer(domId).hasOwnProperty('destroy'))
                this.youtubeObjects[domId].destroy();
        },

        getPeriodOfDay: function() {
            var hour = parseFloat(moment().format('H'));
            return (hour >= 5.5 && hour <= 12 ? "morning" : (hour > 12 && hour <= 16.5 ? "afternoon" : (hour > 16.5 && hour <= 21) ? "evening" : "night"));
        },

        isValidURL: function(str) {
            return /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(str);
        },

        textFormatter: function(val) {
            return parseInt(val).toLocaleString();
        },

        getManyCss: function(urls, callback, nocache){
            if (typeof nocache=='undefined') nocache=false; // default don't refresh
            $.when(
                $.each(urls, function(i, url){
                    if (nocache) url += '?_ts=' + new Date().getTime(); // refresh?
                    $.get(url, function(){
                        $('<link>', {rel:'stylesheet', type:'text/css', 'href':url}).appendTo('head');
                    });
                })
            ).then(function(){
                    if (typeof callback=='function') callback();
                });
        },

        setYouTubePlayer: function(domId, callback) {
            var self = this;
            ljs.load('https://www.youtube.com/iframe_api', function() {
                var setObject = function(callback) {
                    self.youtubeObjects[domId] = new window.YT.Player(domId, {
                        height: '227',
                        width: '470',
                        playerVars: {
                            autoplay: 1
                        },
                        events: {
                            'onReady':  function(event) {
                                //callback(event.target);
                                callback(event.target);

                            },
                            onStateChange: function(e){
                                try {
                                    if (e.data === window.YT.PlayerState.ENDED) {
                                        self.youtubeObjects[domId].playVideo();
                                    }
                                } catch (ev) { dbg(ev); }
                            }
                        }
                    });
                };
                if (_.isUndefined(window.onYouTubeIframeAPIReady)) {
                    window.onYouTubeIframeAPIReady = function () {
                        setObject(callback);
                    };
                    return;
                }

                try {
                    if (_.isUndefined(self.youtubeObjects[domId])) {
                        setObject(callback);
                    }
                    else {
                        try {
                            callback(self.youtubeObjects[domId]);
                        } catch (e) {
                            // In case not attached to the dom
                            setObject(callback);
                        }
                    }
                } catch(e) {
                    setObject(callback);

                }
            });


            //if (_.isUndefined(window.onYouTubeIframeAPIReady)) {
            //    window.onYouTubeIframeAPIReady = function() {
            //        setObject(callback);
            //    };
            //} else {
            //
            //    if (_.isUndefined(this.youtubeObjects[domId])) {
            //        setObject(callback);
            //    }
            //    else {
            //        try {
            //            callback(self.youtubeObjects[domId]);
            //        } catch (e) {
            //            // In case not attached to the dom
            //            setObject(callback);
            //        }
            //    }
            //}
        },

        fixJsonBooleans: function(json, arrFields) {
            _.each(arrFields, function(val) {
                if (val.indexOf('.') !== -1) {
                    var chunks = val.split('.');
                    json[chunks[0]][chunks[1]] = json[chunks[0]][chunks[1]] !== 'false';
                }
                else
                    json[val] = json[val] !== 'false';
            });

            return json;
        },

        fixJsonIntegers: function(json, arrFields) {
            _.each(arrFields, function(val) {
                if (val.indexOf('.') !== -1) {
                    var chunks = val.split('.');
                    json[chunks[0]][chunks[1]] = parseInt(json[chunks[0]][chunks[1]]);
                }
                else
                    json[val] = parseInt(json[val]);
            });

            return json;
        },

        fixJson: function(json, arrFields, callback) {
            _.each(arrFields, function(val) {
                if (val.indexOf('.') !== -1) {
                    var chunks = val.split('.');
                    json[chunks[0]][chunks[1]] = callback.call(this,json[chunks[0]][chunks[1]]);
                }
                else
                    json[val] = callback.call(this,json[val]);
            });

            return json;
        }
    };

    var UI = {
        DarkMode: {
            toggle: function(bool) {
                if
                (bool) this.set();
                else
                    this.unset();
            },
            set: function() {
                $('body').toggleClass('dark-mode', true);
                $('.night-day-mode-switch').find('.onoffswitch-checkbox').prop('checked',true);
            },
            unset: function() {
                $('body').toggleClass('dark-mode', false);
                $('.night-day-mode-switch').find('.onoffswitch-checkbox').prop('checked',false);
            }
        },
        SnackBar: {
            timer: null,
            show: function(html) {
                var $snackBar = $('#snackbar');
                if (!_.isNull(this.timer))
                {
                    clearTimeout(this.timer);
                    $snackBar.removeClass('show');
                }

                $snackBar.addClass("show");
                $snackBar.find('.snackbar-inner').html(html);

                this.timer = setTimeout(function(){
                    $('#snackbar').removeClass('show');
                }, 3750);
            }
        },

        Preloader: {
            set: function($dom, setup) {
                setup = _.isObject(setup) ? setup : {};
                if ($dom.find('.preloader').length)
                    this.remove($dom);

                var newHeight = $dom.outerHeight() - (!!setup.top ? parseFloat(setup.top.replace('px','')) : 0);
                $dom.append('<div class="preloader"><img src="img/ring.svg"></div>');
                $dom.find('.preloader').css({
                    height: newHeight + 'px',
                    top: setup.top ? setup.top : 0
                });

                $dom.data('preloader-callback',setup.callback);
            },
            remove: function($dom) {
                var cb = $dom.data('preloader-callback');
                if (_.isFunction(cb))
                    cb();
                $dom.find('.preloader').remove();

            }
        },

        Tabs: {
            open: function (tabId, containerId) {
                var i, tabContent, tabLinks;

                App.TuneManager.CurrentPlayingSound.stopCurrentPlayer();

                if (document.getElementById(containerId) === null || document.getElementById(containerId).length === 0)
                    return; // Not loaded yet

                tabContent = document.getElementById(containerId).getElementsByClassName("v-tab-content");
                for (i = 0; i < tabContent.length; i++) {
                    tabContent[i].style.display = "none";
                }
                tabLinks = document.getElementById(containerId).getElementsByClassName("v-tab-links");
                for (i = 0; i < tabLinks.length; i++) {
                    tabLinks[i].className = tabLinks[i].className.replace(" active", "");
                }

                document.querySelector('#' + containerId + ' #' + tabId).style.display = "block";
                $('.v-' + tabId).addClass('active');
            }
        },

        Tippy: {
            reference: [],
            refresh: function() {
                //if (typeof tippy === 'function')
                //if (!_.isNull(this.obj) && typeof this.obj === 'object')
                //    parent.tippy.destroy($('.tippy-obj'));

                this.reference = (window.tippy('.tippy'));
            }
        },

        init: function() {
            this._bindInitialEvents();
        },

        _bindInitialEvents: function() {
            this.bindPlayers();
            this.bindIntroJS();
        },

        bindIntroJS: function() {
            $('.btn-help').on('click', function() {
                ljs.load(['js/vendor/intro.min.js', 'css/vendor/introjs.min.css'], function(){
                    window.introJs().start();

                });
            });

        },

        bindPlayers: function() {
            var tm = App.TuneManager,
                restartPlayer = function($playWrapper) {
                    var src = $playWrapper.data('src');
                    tm.CurrentPlayingSound.replaceAndStart(src,$playWrapper,
                        function() {
                            // OnLoad
                            var $textPlay = $playWrapper.find('.text-play');
                            if (!_.isUndefined($textPlay) && _.isUndefined($textPlay.attr('disable-play-text')))
                                $playWrapper.find('.text-play').text('Playing');

                            $playWrapper.addClass('playing');
                        },
                        function() {
                            // OnEnd
                            var $textPlay = $playWrapper.find('.text-play');
                            $playWrapper.removeClass('playing');
                            if (!_.isUndefined($textPlay) && _.isUndefined($textPlay.attr('disable-play-text')))
                                $playWrapper.find('.text-play').text('Play');
                        });
                };

            $('.play-wrapper').unbind('click.mc').bind('click.mc',function(ev) {
                var $this = $(this);

                ev.stopPropagation();

                var $playText = $this.find('.text-play');
                if (tm.CurrentPlayingSound.isActive()) { // Active - then stop
                    tm.CurrentPlayingSound.$dom.removeClass('playing');
                    var isSameElement = tm.CurrentPlayingSound.isDom($this);

                    if ($playText.length && _.isUndefined($playText.attr('disable-play-text')))
                        $playText.text('Play');

                    if (isSameElement) // stop last, start current
                    {
                        tm.CurrentPlayingSound.setInactive();
                    }
                    else {
                        restartPlayer($this);
                    }
                } else { // Not active - then play
                    restartPlayer($this);
                    if ( _.isUndefined($playText.attr('disable-play-text')))
                        $playText.text('Loading');
                    $this.addClass('playing');
                }
            });
        },

    };

    var EventManager = {
        $document: $(document),
        on: function(eventName, args, func) {
            if (typeof args === 'function')
                this.$document.on(eventName,args);
            else {
                args = typeof args === 'object' ? args : {};
                this.$document.on(eventName,args,func);
            }
        },

        emit: function(eventName, argsArr) {
            if (_.isUndefined(argsArr))
                argsArr = [];

            if (!_.isArray(argsArr))
                argsArr = [argsArr];

            this.$document.trigger(eventName, argsArr);
        }

    };

    var GAnalytics = {
        app: function(action, label) {
            window.ga('send', {
                hitType: 'event',
                eventCategory: 'Application',
                eventAction: action,
                eventLabel: label
            });
        }

    };

    var Backend = {
        _ajax: function(url, data, type) {
            return $.ajax({
                url: '/api' + url,
                data: { params: _.isUndefined(data) ? [] : data },
                type: type,
                dataType: 'json'
            });

        },
        GET: function(url,data) {
            return this._ajax(url,data, 'GET');
        },
        POST: function(url,data) {
            return this._ajax(url,data, 'POST');
        },
        PUT: function(url,data) {
            return this._ajax(url,data, 'PUT');
        },
        DELETE: function(url,data) {
            return this._ajax(url,data, 'DELETE');
        }

    };

    var User = {
        defaultData: {
            is_logged_in: false,
            fbid: null,
            firstname: 'Guest',
            lastname: '',
            email: '',
            picture: 'https://www.metaclock.com/img/user.png',
        },

        getPictureURL: function() { return this.data.picture; },

        getFirstName: function() { return this.data.firstname; },
        getTuneBasePath: function() {
            return "uploads/" + App.User.getUserId() + "/";
        },

        data: {},
        getUserId: function() { return this.data.fbid; },

        isLoggedIn: function() { return this.data.is_logged_in; },
        getData: function() {
            return this.data;
        },
        applyData: function(newData) {
            this.data = _.merge(_.clone(this.defaultData, true), newData);
            // Bind events, init params, etc.
            if (!this.isLoggedIn())
                this._applyDefaultHeader();
            else
                this._applyDataToHeader();

        },

        setLoggedIn: function(newData) {
            var self = this;
            this.data.is_logged_in = true;
            self.applyData(newData);
        },

        openLoggingInDialog: function(userID, onOpen) {
            if (_.isUndefined(userID))
            {
                dbg('Serious error - userID is undefined');
            }
            return $.dialog({
                title: false,
                content:    '<div style="display:inline-block"><img class="user-image" src="https://graph.facebook.com/' + userID +
                "/picture?type=square\" style=\"display: inline; width: 49px;\"></div>" +
                '<div style="display: inline-block; font-size: 16px;margin-left: 11px;margin-top: 15px;">' +
                'Loading your personal settings...' +
                '</div>',
                escapeKey: false,
                onOpen: onOpen,
                closeIcon: false, // hides the close icon.
                type: 'blue',
                backgroundDismiss: false,
                boxWidth: '370px',
                useBootstrap: false
            });
        },

        setLoggedOut: function() {
            this.applyData(this.defaultData);
        },

        init: function(data) {
            var self = this;
            this.applyData(data || this.defaultData);


            $('.ppl-num').text(App.Utils.textFormatter(window.initValues.people_count));

            // Bind events
            $('.btnLoginFacebook').on('click',this.login);
            $('.btnLogout').on('click',this.logout);

            App.EventManager.on('User.logged-out', function(data) {
                self.setLoggedOut.apply(self,data);
            });
        },

        shareTune: function() {
            window.FB.ui(
                {
                    method: 'share',
                    href: 'https://www.metaclock.com'
                }, function(response){
                    dbg(message);
                });
        },

        _applyDataToHeader: function() {
            $('.header-content .user-image')
                .attr('src',App.User.getPictureURL())
                .show();
            $('.header-content .user-name').show().find('.text-name').text(this.data.firstname);
            $('.header-content .greeting').text('Good ' + Utils.getPeriodOfDay());
            $('.header-content .login-btn-wrapper').hide();
        },
        _applyDefaultHeader: function() {
            // Show login button (default)
            $('.header-content .user-image').hide();
            $('.header-content .user-name').hide();
            $('.header-content .user-name').hide();
            $('.header-content .btnLoginFacebook').show();
            $('.header-content .login-btn-wrapper').show();
        },

        login: function(ev,cb,forceLogin) {
            forceLogin = typeof forceLogin !== 'undefined' ? forceLogin : true;
            var completeLoginAjax = function(authResponse,callback) {
                var $dialog = App.User.openLoggingInDialog(authResponse.userID,function() {
                    var promise = Backend.POST('/complete-login', {authResponse: authResponse, data: App.getData()}).done(function(newData) {
                        App.setData(newData);

                        if (_.isFunction(callback))
                            callback.call();

                        App.EventManager.emit('User.logged-in');

                    });
                    promise.fail(function(e) {
                        App.ErrorHandler.error("Apologies, logging-in is not be available at the moment. Please try again later.");
                        dbg(e);

                    });
                    promise.always(function() {
                        $dialog.close();
                    });
                });

            };

            window.FB.getLoginStatus(function(statusRes) {
                if(statusRes.status !== 'connected') {
                    if (!forceLogin)
                        return;
                    window.FB.login(function(loginRes) {
                        if (loginRes.status === 'unknown')
                            return;

                        completeLoginAjax(loginRes.authResponse,cb);
                    });
                } else {
                    // Connected
                    completeLoginAjax(statusRes.authResponse,cb);
                }
            });

        },
        logout: function() {
            window.FB.getLoginStatus(function(ret) {
                /// are they currently logged into Facebook?
                if(ret.authResponse) {
                    //they were authed so do the logout
                    Backend.GET('/complete-logout', function() {
                        try {
                            window.FB.logout(function(response) {
                                dbg('fb logout:',response);
                                // user is now logged out
                                App.EventManager.emit('User.logged-out');
                            });
                        }
                        catch (e) {
                            dbg(e);
                            App.EventManager.emit('User.logged-out');
                        }
                    });
                } else {
                    App.EventManager.emit('User.logged-out');
                }
            });

        }
    };

    var ErrorHandler = {
        openDialogs: [],
        loginPrompt: function(msgAppend, callbackAfterLogin, skip, isSkip) {
            isSkip = typeof isSkip === 'undefined' ? false : isSkip;
            this.infoPrompt(
                "<strong>You are not logged-in.</strong>. <br /> <br /> " + msgAppend,
                {
                    button: 'Connect',
                    action: function() {
                        User.login(undefined,callbackAfterLogin);
                    }
                },
                {
                    button: isSkip ? 'Skip' : 'Cancel',
                    action: skip
                }
            );
            return prompt;
        },

        areDialogsOpen: function() {
            var ret = false;
            _.each(this.openDialogs, function(obj) {
                if (obj.isOpen())
                    ret = true;

            });

            return ret;
        },

        error: function(msg) {
            var alert = $.alert({
                title: 'Oops',
                content: msg,
                escapeKey: true,
                type: 'red',
                backgroundDismiss: true,
                boxWidth: '500px',
                useBootstrap: false
            });

            this.openDialogs.push(alert);
            return prompt;

        },

        info: function(title, msg) {
            var alert = $.alert({
                title: title,
                content: msg,
                escapeKey: true,
                type: 'orange',
                backgroundDismiss: true,
                boxWidth: '500px',
                useBootstrap: false
            });

            this.openDialogs.push(alert);
            return prompt;

        },
        errorPrompt: function(msg, ok, cancel) {
            var prompt = $.confirm({
                escapeKey: false,
                type: 'red',
                backgroundDismiss: false,
                boxWidth: '370px',
                useBootstrap: false,
                title: 'Oops',
                content: msg,
                buttons: {
                    ok: _.isFunction(ok.action) ? ok : function () {},
                    'Cancel': _.isFunction(cancel.action) ? cancel : function () {},
                }
            });

            this.openDialogs.push(prompt);
            return prompt;

        },

        infoPrompt: function(msg, ok, skip, autoClose, title) {
            var buttons = {};
            buttons[ok.button] = _.isFunction(ok.action) ? ok.action : function () {};
            buttons[skip.button] = _.isFunction(skip.action) ? skip.action : function () {};

            var prompt = $.confirm({
                escapeKey: false,
                title: typeof title === 'undefined' ? 'Oops' : title,
                type: 'orange',
                backgroundDismiss: false,
                boxWidth: '370px',
                autoClose: typeof autoClose === 'undefined' ? false : autoClose,
                useBootstrap: false,
                content: msg,
                buttons: buttons
            });

            this.openDialogs.push(prompt);

            return prompt;
        },

        closeAll: function() {
            _.each(this.openDialogs, function(obj) {
                obj.close();
            });
        }
    };

    $(document).ready(function() {
        window.App = {
            ErrorHandler: ErrorHandler,
            UI: UI,
            User: User,
            Backend: Backend,
            GAnalytics: GAnalytics,
            EventManager: EventManager,
            AjaxDialogs: {},
            Utils: Utils,

            _hasChanged: false,

            changed: function() { this._hasChanged = true; },
            setUnchanged: function() { this._hasChanged = false; },
            hasChanged: function() { return this._hasChanged; },

            start: function() {
                var data = window.userSettings;
                delete window.userSettings;

                // Header init
                if (!window.screenfull.enabled)
                    $('.full-screen-btn').hide();

                // Set services
                this.User.init(data && data.user);

                this.UI.init();

                if (typeof window.isFbInit !== 'undefined' && !this.User.isLoggedIn()) {
                    this.initFbUser();
                    delete window.isFbInit;
                }
            },

            initFbUser: function() {
                if (!this.User.isLoggedIn())
                    this.User.login(undefined, function() {
                        dbg('callback POWER');
                    }, false);
            },

            setData: function(data) {
                this.User.applyData(data && data.user);
            },

            getData: function() {
                var ret = _.merge(
                    {
                        'user': this.User.getData()
                    }
                );
                return ret;
            }
        };

        App = window.App;
        try
        {
            App.start();
        }
        catch(e)
        {
            window.fatal(e);
            App.ErrorHandler.errorPrompt(
                "Sorry, looks like we got confused. Refreshing the page might help us to get back on track.",
                function() {
                    App.Backend.GET('/complete-logout').done(function() {
                        window.location.reload();

                    });
                },
                function() {

                }
            );
            App.GAnalytics.app('Exception', 'Fatal');
        }
    });


})(window, window.$, window._, window.moment, window.tippy, window.ljs, window.dbg);