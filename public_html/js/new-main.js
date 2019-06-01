"use strict";
$(function () {
  var IS_PROD = false;

  // Application settings
  window.App = {
    url: IS_PROD ? 'https://www.metaclock.com' : 'https://www.metaclock.com:80',
    documentTitle: null,
    timer: null,
    titleTimer: null,
    initialView: {},
    nightView: {},
    alarmView: {
      youtubePlayer: null,
    },
    /**
     * 0 = Reset view (initial)
     * -1 = Sleeping
     * 1 = Woke up
     */
    viewMode: 0,
    settings: {},
    debug: function(msg, msg2) {
      console.log(msg);
      if (typeof msg2 !== 'undefined') {
        console.log(msg2);
      }
    },

    dom: {
      // Common
      $document: $(document),
      $window: $(window),
      $ubaPlayer: $("#ubaplayer"),
      
      $env: $('.env'),

      // Alarm time
      $wakeUpTimeInnerCont: $('.wut_inner_container'),
      $hoursInput: $('.wut_hours'),
      $minutesInput: $('.wut_minutes'),
      $wutDelimiter: $('.wut_delimiter')[0],
      $timeToWakeUp: $('#time_to_wake_up'),

      // Alarm controls
      $settingsBtn: $('.set_alarm_btn_container .icon-equalizer'),

      // Modals
      $tuneModal: $("#tune_modal"),
      $settingsModal: $('#settings_modal'),
      $alarmFullScreen: $('.icon-enlarge'),
      $wakeUpModeTuneContainer: $('#wake_up_mode_tune_container'),
      $setAlarmContainer: $('#set_alarm_container'),

      // Night mode view
      $snoozeButton: $('#snooze_settings_button'),

      // Alarm mode view
      $iconShareCont: $('.icon_share_cont'),
      $snoozeContainer: $('.icon_snooze_cont'),
      $resetContainer: $('.icon_alarm_on_cont'),
      $resetButton: $('#reset_button'),
    },

    viewControl: {
      setHomeView: function() {
        App.viewMode = 0;
        // todo - ?

        App.utils.clearTimers();

        App.dom.$wakeUpModeTuneContainer.hide();
        App.dom.$setAlarmContainer.show();

        App.dom.$document.off('keypress.alarm');
        App.dom.$window.off('beforeunload');

        App.utils.stopAllPlayers();
        App.dom.$env.removeClass('night');
      },

      setNightView: function(hours, minutes, wakeupTimeObj) {
        var wakeupTime = wakeupTimeObj.getSeconds() + wakeupTimeObj.getMinutes() * 60 + wakeupTimeObj.getHours() * 60 * 60;
        wakeupTime *= 1000;

        App.viewMode = -1;

        App.utils.clearTimers();
        App.titleTimer = setInterval(function() {
          var time = App.utils.calcMsDiffFromNow(App.dom.$hoursInput.val(),App.dom.$minutesInput.val());
          var hours = time.getHours();
          var minutes = time.getMinutes();
          minutes = minutes < 10 ? "0" + minutes : minutes;
          hours = hours < 10 ? "0" + hours : hours;

          document.title = hours + ":" + minutes + " hours to wake up";
        }, 1000);

        // Helpers
        var sleep = {
          prevent: function() {
            if (!this._video) {
              this._init();
            }

            this._video.setAttribute('loop', 'loop');
            this._video.play();
          },
          _init: function() {
            this._video = document.createElement('video');
            this._video.setAttribute('width', '10');
            this._video.setAttribute('height', '10');
            this._video.style.position = 'absolute';
            this._video.style.top = '-10px';
            this._video.style.left = '-10px';

            var source_mp4 = document.createElement('source');
            source_mp4.setAttribute('src', App.url + '/muted-blank.mp4');
            source_mp4.setAttribute('type', 'video/mp4');
            this._video.appendChild(source_mp4);

            var source_ogg = document.createElement('source');
            source_ogg.setAttribute('src', App.url + '/muted-blank.ogv');
            source_ogg.setAttribute('type', 'video/ogg');
            this._video.appendChild(source_ogg);

            document.body.appendChild(this._video);
          },
          _video: null
        };

        sleep.prevent();
        App.dom.$timeToWakeUp.val(hours + ":" + minutes);

        App.dom.$env.addClass('night');
        App.dom.$wakeUpModeTuneContainer.hide();
        App.utils.stopAllPlayers();

        App.dom.$document.off('keypress.alarm');
        App.dom.$window.off('');

        App.timer = setTimeout(function() {
          App.viewControl.setWakingUpView();
        }, wakeupTime);

        App.dom.$window.unbind("beforeunload").bind("beforeunload",function() {
          return "Leaving this page will cancel your alarm. Are you sure?";
        });
      },
      setWakingUpView: function() {
        App.viewMode = 1;

        App.dom.$document.off('keypress.alarm');
        App.dom.$window.off('beforeunload');

        App.utils.clearTimers();

        App.dom.$setAlarmContainer.hide();
        App.dom.$wakeUpModeTuneContainer.find('.wake_up_cont').hide();

        App.dom.$wakeUpModeTuneContainer.hide().removeClass('hidden');

        App.dom.$document.on('keypress.alarm', function(e) {
          if ((e.keyCode === 0 || e.keyCode === 32) && App.viewMode === 1) {
            e.preventDefault();

            App.viewControl.setHomeView();
          }
        });

        setTimeout(function() {
        if (App.viewMode === 0) {
          return;
        }

        if ($($('.tunes_list li.selected_tune')[0]).parents(".tunes_list").length) {
          // If selected a tune...

          var $tuneCont = App.dom.$wakeUpModeTuneContainer.find('#wake_up_tune');
          $tuneCont.show();

          App.dom.$wakeUpModeTuneContainer.fadeIn("slow");

          App.utils.playerPlay($('.selected_tune .ubaplayer-button'));

        } else {

          var $selectedYouTube = $('#youtube_search_results li.selected_tune');
          var videoId = $selectedYouTube.attr('videoId');
          if (videoId) {
//            App.alarmView.youtubePlayer.loadPlaylist({list: videoId, index: 1});
            App.alarmView.youtubePlayer.loadVideoById(videoId);
          }

          var $ytCont = App.dom.$wakeUpModeTuneContainer.find('#wake_up_youtube_video');
          $ytCont.show();

          App.dom.$wakeUpModeTuneContainer.fadeIn("slow");

        }

      }, 2000);

        App.dom.$env.removeClass('night');

        // TODO - Maybe a quote in the sky
      },
    },

    handlers: {
      toggleScreen: function() {
        var elem = document.documentElement;
        if (!document.fullscreenElement && !document.mozFullScreenElement &&
          !document.webkitFullscreenElement && !document.msFullscreenElement) {
          if (elem.requestFullscreen) {
            elem.requestFullscreen();
          } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
          } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
          } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
          }
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
          } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
          }
        }
      },
      chooseSnooze: function(elem) {
        var $elm = $(elem.currentTarget);
        $('.current_snooze').text($elm.text());
        App.dom.$snoozeButton.find('li').removeClass('selected_snooze');
        $elm.addClass('selected_snooze');
      },
      refreshClockView: function () {
        var minutes = parseInt($('.wut_minutes').val());
        var hours = parseInt($('.wut_hours').val());
        App.dom.$minutesInput.clockpicker('refreshView', hours, minutes);
        App.dom.$hoursInput.clockpicker('refreshView', hours, minutes);
      },
      hourTriggerFocus: function (e) {
        if (e.target !== this && e.target !== App.dom.$wutDelimiter) {
          return
        }

        setTimeout(function () {App.dom.$hoursInput.trigger('focus')}, 0);
      },
      openModal: function($modalTriggerElem) {
        return function () {
          $modalTriggerElem.iziModal('open');
        }
      },
      loadEvent: function () {
        var $preloader = $('#preloader');
        $preloader.animate({'opacity': 0}, {
          complete: function () {
            $('#site_container').animate({'opacity': 1});
            $preloader.css('z-index', -1);
          }
        });
        App.dom.$env.removeClass('hidden');

        $('.cloud').each(function () {
          var value = Math.random() * (320 - 150) + 150;
          $(this).css('top', value + "px");
        });

        gapi.load("client", function () {
          gapi.client.setApiKey("AIzaSyDNLiIgEPo9q_k9qIM8PgxgPh9G8buFl3Y");
          gapi.client.load("https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest")
            .then(function () {},
                  function (err) { console.error("Error loading GAPI client for API", err); });

        });
      },
      tabsSwitchEvent: function () {
        var $tuneTabsContent = $('#tune_modal .tabs_content');
        var $this = $(this);
        if (!$this.hasClass('active')) {
          return;
        }

        $tuneTabsContent.find('.' + App.dom.$tuneModal.find('a.tab:not(.active)').attr('tab') + '_content').fadeOut(function () {
          $tuneTabsContent.find('.' + $this.attr('tab') + '_content').fadeIn(function () {
            if ($this.hasClass('tab_youtube')) {
              $('#youtube_search').focus();
            }
          });
        });
      },
      setAlarmEvent: function () {
        var hours = App.dom.$hoursInput.val();
        var minutes = App.dom.$minutesInput.val();

        var msDiff = App.utils.calcMsDiffFromNow(hours,minutes);

        // todo - temp
        msDiff.setHours(0);
        msDiff.setMinutes(0);
        msDiff.setSeconds(4);
        //todo - temp

        App.viewControl.setNightView(hours, minutes, msDiff);
      },
      setSelectedTuneOrVideo: function() {
        var $tunesList = $('.tunes_list li, #youtube_search_results li');
        var $this = $(this);

        $tunesList.find('.icon-checkmark').remove();
        $tunesList.removeClass('selected_tune');
        $this.addClass('selected_tune');
        $this.append('<svg class="icon icon-checkmark"><use xlink:href="#icon-checkmark"></use></svg>');

//        if ($(this).parent('.tunes_list').length) {
//          $('#ok_tune').text('Use selected tune');
//        } else {
//          $('#ok_tune').text('Use selected video');
//        }
      },
      fbShareEvent: function() {
          FB.ui({
            method: 'share',
            href: App.url,
            hashtag: "#metaclock"

          }, function(response){});
      },
      applySnooze: function() {
        var snoozeTextSplit = $('.current_snooze').text().split("Snooze in ");
        var snoozeTime = snoozeTextSplit.length !== 2 ? 5 : parseInt(snoozeTextSplit[1].split(" minutes")[0]);
        var now = new Date();
        var currentHours = now.getHours(), currentMinutes = now.getMinutes();
        var newMinutes = currentMinutes + snoozeTime >= 60 ? snoozeTime - (60 - currentMinutes) : currentMinutes + snoozeTime;
        var newHours = currentMinutes + snoozeTime >= 60 ? currentHours + 1 : currentHours;

        newMinutes = newMinutes < 10 ? "0" + newMinutes : newMinutes;
        newHours = newHours < 10 ? "0" + newHours : newHours;

        var msDiff = App.utils.calcMsDiffFromNow(newHours, newMinutes);

        App.viewControl.setNightView(newHours, newMinutes, msDiff)
      }
    },

    utils: {
      playerPlay: function($elem) {
        App.dom.$ubaPlayer.ubaPlayer('play', $elem);
      },
      stopAllPlayers: function() {
        try {
          App.dom.$ubaPlayer.ubaPlayer('pause');
        } catch(e) {}

        // Stop a YT video if active
        if (typeof App.alarmView.youtubePlayer !== 'undefined') {
          App.alarmView.youtubePlayer.stopVideo()
        };
      },
      calcMsDiffFromNow: function(hours, minutes) {
    hours = parseInt(hours);
    minutes = parseInt(minutes);
    var newHours, newMinutes, delta, retDate;

    var now = new Date();
    var tomorrow = new Date();

    if ((now.getHours() > hours) || (now.getHours() === hours && now.getMinutes() > minutes)) {
      tomorrow.setDate(now.getDate() + 1);
    }

    tomorrow.setHours(hours);
    tomorrow.setMinutes(minutes);
    tomorrow.setSeconds(0);


    retDate = new Date(tomorrow.getTime());
    delta = Math.abs(tomorrow - now) / 1000;
    delta -= Math.floor(delta / 86400) * 86400;

    newHours = Math.floor(delta / 3600) % 24;
    delta -= newHours * 3600;

    newMinutes = Math.floor(delta / 60) % 60;

    retDate.setHours(newHours);
    retDate.setMinutes(newMinutes);
    retDate.setSeconds(0);

    return retDate;
  },
      clearTimers: function() {
        clearTimeout(App.timer);
        clearInterval(App.titleTimer);
        document.title = App.documentTitle;
      }
    },

    init: function() {
      if (!IS_PROD) {
        window.dbg = App.debug;
      }

      var initPlayer = function() {
        App.dom.$ubaPlayer.ubaPlayer({codecs: [{name:"MP3", codec: 'audio/mpeg;'}], loop: true});
      };

      var initYouTube = function() {
        window.onYouTubeIframeAPIReady = function() {
            App.alarmView.youtubePlayer = new YT.Player('youtube_preview_iframe', {
              height: '100%',
              width: '100%',
              loop: 1,
              videoId: 'eTu5bZKpTkI',
              playerVars: {
                playlist: 'eTu5bZKpTkI', // debug: eTNN8MtY4Io
                wmode:'opaque',
                enablejsapi: true,
                autoplay: 1,
                controls: 1,
                showinfo: 1,
                modestbranding: 0, // Hide the Youtube Logo
                loop: 1,
                fs: 1,
                cc_load_policy: 1,
                autohide: 0,
                rel: 0
              },
              events: {
                'onReady': function(event) {
                  event.target.setVolume(100);
                },
                'onStateChange': function(event) {
                  if (event.data === YT.PlayerState.ENDED) {
                    App.alarmView.youtubePlayer.seekTo(0);
                    App.alarmView.youtubePlayer.playVideo();
                  }
                }
              }
            });
        };

        var tag = document.createElement('script');

        tag.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);


      };

      var initFacebookIntegration = function() {
        var $loggedInView = $('#logged_in_view');
        var $loginLogoutLink = $('#login_logout_link');
        
        // Initialization and globals
        (function(d, s, id) {
          var js, fjs = d.getElementsByTagName(s)[0];
          if (d.getElementById(id)) return;
          js = d.createElement(s); js.id = id;
          js.src = "https://connect.facebook.net/en_US/sdk.js";
          fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));

        window.statusChangeCallback = function(response) {
          $('.icon-spinner9').hide();
          if (response.status === 'connected') {
            completeFacebookLogin();
          } else {

            $loggedInView.hide();
            $loginLogoutLink.show();

            window.data.isLoggedIn = false;
            // todo - refresh view?
          }
        };

        window.checkLoginState = function() {
          FB.getLoginStatus(function(response) {
            window.statusChangeCallback(response);
          });
        };

        window.fbAsyncInit = function() {
          FB.init({appId:'323484318322219', cookie:true, xfbml:true, version:'v3.3'});
          FB.getLoginStatus(function(response) {
            window.statusChangeCallback(response);
          });
        };

        window.logoutUser = function() {
          FB.logout(function(response) {
            $loggedInView.hide();
            $loginLogoutLink.show();
            window.data.isLoggedIn = false;
          });
        };

        window.completeFacebookLogin = function() {
          var getGreeting = function() {
            var  date = new Date();
            var hour = date.getHours();
            if (hour < 12) {
              return "Good morning";
            } else {
              if (hour >= 12 && hour < 17) {
                return "Good afternoon";
              } else {
                if (hour >= 17 && hour < 19) {
                  return "Good evening";
                } else
                if (hour >= 19) {
                  return "Good night";
                }
              }
            }
          };

          if (window.data.isLoggedIn === true) {
            $loggedInView.show();
            $loginLogoutLink.hide();
            // todo - refresh view ?
          } else {
            FB.api('/me?fields=id,first_name,last_name,email', function(response) {
              // User is logged in but need to get his settings
              $.ajax({
                method: 'POST',
                url: "api/login-user",
                data: {
                 'fb_id': response.id,
                 'settings': App.settings,
                 'first_name': response.first_name,
                 'last_name': response.last_name,
                 'email': response.email
                },
                success: function(result){
                 $loggedInView.show();
                 $loginLogoutLink.hide();
                 $('#user_name').text(getGreeting() + ", " + result.first_name);
                 $('#login_image').find('img').attr('src', 'https://graph.facebook.com/' + result.id + '/picture?type=square');
                 window.data.isLoggedIn = true;
                 dbg('did an ajax to login');
//                 window.data.userInfo = result.settings; // todo - ? laasot seder
                 // todo - refresh view?
                },
                error: function(err) {
                 console.log(err);
                  $loggedInView.hide();
                  $loginLogoutLink.show();
                }
              });
            });
          }
        };
      };

      var initJqueryFunctions = function() {
        // Custom jquery methods
        $.fn.inputFilter = function (inputFilter) {
          return this.on("input keydown keyup mousedown mouseup select contextmenu drop", function () {
            if (inputFilter(this.value)) {
              this.oldValue = this.value;
              this.oldSelectionStart = this.selectionStart;
              this.oldSelectionEnd = this.selectionEnd;
            } else if (this.hasOwnProperty("oldValue")) {
              this.value = this.oldValue;
              this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
            } else {

            }
          });
        };
      };

      var initClockPicker = function() {
        var updateDomTime = function(e) {
          var zeroBasedMinutes = e.minutes < 10 ? "0" + e.minutes : e.minutes;
          var zeroBasedHours = e.hours < 10 ? "0" + e.hours : e.hours;
          App.dom.$minutesInput.val(zeroBasedMinutes);
          App.dom.$hoursInput.val(zeroBasedHours);
          App.dom.$timeToWakeUp.val(zeroBasedHours + ":" + zeroBasedMinutes);
        };

        var options = function () {
          return {
            placement: 'top',
            default: App.dom.$hoursInput.val() + ":" + App.dom.$minutesInput.val(),
            autoclose: true,
            afterHide: function () {
            },
            beforeShow: function (e) {
              e.minutes = parseInt($('.wut_minutes').val());
              e.hours = parseInt($('.wut_hours').val());
            },
            afterShow: function (e) {
              e.minutes = parseInt($('.wut_minutes').val());
              e.hours = parseInt($('.wut_hours').val());
            },
            afterDone: function (e) {
              updateDomTime(e);
            }
          };
        };
        var inputFilterHelper = function (maxValue, $elem) {
          return function (val) {
            if (!/^\d*$/.test(val)) {
              return false;
            }

            var intVal = parseInt(val);
            if (val.length === 0) {
              $elem.val("00");
            } else if (intVal === 0) {
              $elem.val("00");
            } else if (intVal < 10) {
              $elem.val("0" + intVal);
            } else if (intVal >= 10 && intVal <= maxValue) {
              $elem.val(intVal);
            } else if (intVal > maxValue) {
              return false;
            }

            return true;
          }
        };

        App.dom.$hoursInput.clockpicker(Object.assign(Object.assign({}, options()), {
          afterHourSelect: function (e) {
            updateDomTime(e);
          }
        }));
        App.dom.$minutesInput.clockpicker(Object.assign(Object.assign({}, options()), {
          afterShow: function () {
            App.dom.$minutesInput.clockpicker('toggleView', 'minutes');
          }
        }));
        App.dom.$timeToWakeUp.clockpicker(Object.assign(Object.assign({}, options()), {
          placement: 'left',
          beforeShow: function () {
            $('.hide_on_timepicker').css('opacity', 0.1);
          },
          beforeHide: function() {
            $('.hide_on_timepicker').css('opacity', 1);
          },
          afterHourSelect: function (e) {
            updateDomTime(e);
          }
        }));
        App.dom.$document.on('click', '#time_to_wake_up', function() {
          App.dom.$timeToWakeUp.clockpicker('show');

        });
        App.dom.$hoursInput.inputFilter(inputFilterHelper(23, App.dom.$hoursInput));
        App.dom.$minutesInput.inputFilter(inputFilterHelper(59, App.dom.$minutesInput));
      };

      var initTuneModal = function() {
        App.dom.$tuneModal.iziModal({
          title: 'Select a tune',
          subtitle: '&nbsp;',
          headerColor: '#1a91d2',
          width: 499,
          onOpening: function () {

            var $tabs = $('.tabs');
            if ($tabs.data('inited')) {
              return;
            }

            $tabs.data('inited', true);

            $tabs.on("click", "a", function (e) {

              e.preventDefault();
              $('.tabs a').removeClass("active");
              $(this).addClass('active');
              var activeWidth = $(this).innerWidth();
              var itemPos = $(this).position();
              $(".selector").css({"left": itemPos.left + "px", "width": activeWidth + "px"});
            });

            $('#ok_tune').on('click', function () {
              var $selected = $(App.dom.$tuneModal.find('.selected_tune')[0]);
              var $wakeUpTune = $('.wu_tune');
              var value = $.trim($selected.find('.item_title').text());
              var $iconMusic = $wakeUpTune.find('.icon-music');
              var $iconYoutube = $wakeUpTune.find('.icon-youtube');

              $wakeUpTune.find('.title').text(value);
              $wakeUpTune.attr('title', value);

              if ($selected.parents('#youtube_search_results').length) {
                $iconMusic.addClass('hidden');
                $iconYoutube.removeClass('hidden');
              } else {
                $iconYoutube.addClass('hidden');
                $iconMusic.removeClass('hidden');
              }

              App.dom.$tuneModal.iziModal('close');
            });

            $('#cancel_tune').on('click', function () {
              // TODO - change back to the previously selected tune
              App.dom.$tuneModal.iziModal('close');
            });

            var loadYouTubeResults = function(value) {
              gapi.client.youtube.search.list({"part": "snippet", "maxResults": 25, "q": value, "type": "video"}).then(
                function (response) {
                  var result = response.result.items;
                  $youtubeSearchResults.html("");

                  result.forEach(function (item) {
                    var videoId = item.id.videoId,
                      desc = item.snippet.description,
                      image = item.snippet.thumbnails.default.url,
                      title = item.snippet.title;

                    $youtubeSearchResults.append("<li videoId=\"" + videoId + "\"><div class=\"youtube_image\"><img src=\"" + image + "\"></div>" +
                                                   "<div class=\"youtube_content\">" +
                                                   "<span class='item_title'>" + title + "</span>" +
                                                   "<span class='item_desc'>" + (desc ? desc : "&nbsp;") + "</span>" +
                                                   "</div><a title='Watch on YouTube' target='blank' href='https://www.youtube" +
                                                   ".com/watch?v=" +
                                                   videoId +
                                                   "'><svg title='Watch on YouTube' " +
                                                   "class=\"icon " +
                                                   "icon-new-tab hidden\"><use " +
                                                   "xlink:href=\"#icon-new-tab\"></use></svg></a>" +
                                                   "</li>");
                  });
                },
                function (err) { console.error("Execute error", err); });
            };

            var $youtubeSearch = $('#youtube_search');

            $('.tab_youtube_content .icon-search').on('click', function() {
              loadYouTubeResults($youtubeSearch.val());
            });
            var $youtubeSearchResults = $('#youtube_search_results');

            $youtubeSearch.on('keyup', function (e) {
              if (e.keyCode !== 13) {
                return;
              }

              var value = $(this).val();
              loadYouTubeResults(value);
            });

          },
          onClosing: function() {
            App.utils.stopAllPlayers();
          }
        });
      };

      var initSettingsModal = function() {
        App.dom.$settingsModal.iziModal({
          title: 'Settings',
//          subtitle: '&nbsp;',
          headerColor: '#1a91d2',
          width: 600,
          onOpening: function () {

          },
          onClosing: function() {

          }
        });
      };

      initTuneModal();
      initSettingsModal();
      initPlayer();
      initYouTube();
      initFacebookIntegration();
      initJqueryFunctions();
      initClockPicker();
    },

    initEvents: function() {
      App.dom.$wakeUpTimeInnerCont.on('focus click', App.handlers.hourTriggerFocus);

      App.dom.$minutesInput.on('keyup focus', App.handlers.refreshClockView);

      App.dom.$hoursInput.on('keyup focus', App.handlers.refreshClockView);

      App.dom.$snoozeButton.find('li').on('click', App.handlers.chooseSnooze);

      App.dom.$resetButton.on('click', App.viewControl.setHomeView);

      App.dom.$alarmFullScreen.on('click', App.handlers.toggleScreen);

      App.dom.$document.on('click', '.wu_tune', App.handlers.openModal(App.dom.$tuneModal));

      App.dom.$window.on('load', App.handlers.loadEvent);

      App.dom.$document.on('click', '.set_alarm_btn', App.handlers.setAlarmEvent);

      App.dom.$document.on('click','.tab_youtube, .tab_tune', App.handlers.tabsSwitchEvent);

      App.dom.$document.on('click','.tunes_list li, #youtube_search_results li', App.handlers.setSelectedTuneOrVideo);

      App.dom.$iconShareCont.on('click', App.handlers.fbShareEvent);

      App.dom.$resetContainer.on('click', App.viewControl.setHomeView);

      App.dom.$snoozeContainer.on('click', App.handlers.applySnooze);

      App.dom.$settingsBtn.on('click', App.handlers.openModal(App.dom.$settingsModal));
    },

    run: function() {
      $('#site_container').css('opacity', 0);
      App.documentTitle = document.title;

      App.debug(window.data);

      if (window.data.userInfo !== null) {
        // User has data from server
        var settings = window.data.userInfo.settings;
        App.settings = typeof settings === "object" ? settings : {};
      }

      App.init();
      App.initEvents();
    },
  };

  App.run();
});

