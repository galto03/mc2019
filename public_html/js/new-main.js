"use strict";
$(function () {
  var DEBUG_VERBOSITY_LEVEL = 2; // 0 - Nothing, 1 - Some, 2 - All

  // Application configuration
  window.App = {
    timer: null,
    /**
     * 0 = Reset view (initial)
     * -1 = Sleeping
     * 1 = Woke up
     */
    viewMode: 0,
    configuration: {}
  };

  if (window.data.userInfo !== null) {
    window.App.configuration = window.data.userInfo.configuration;
  }

  var debug = function(msg, verbosity) {
    verbosity = typeof verbosity === 'undefined' ? 2 : verbosity;
    if (verbosity === DEBUG_VERBOSITY_LEVEL) {
      console.log(msg);
    }
  };

  debug(data);

  window.statusChangeCallback = function(response) {
    $('.icon-spinner9').hide();
    if (response.status === 'connected') {
      completeFacebookLogin();
    } else {
      $('#logged_in_view').hide();
      $('#login_logout_link').show();

      window.data.isLoggedIn = false;
      // todo - refresh view?
    }
  };

  window.checkLoginState = function() {
    FB.getLoginStatus(function(response) {
      statusChangeCallback(response);
    });
  };

  window.fbAsyncInit = function() {
    FB.init({appId:'323484318322219', cookie:true, xfbml:true, version:'v3.3'});
    FB.getLoginStatus(function(response) {
      statusChangeCallback(response);
    });
  };

  // Load the SDK asynchronously
  (function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'facebook-jssdk'));

  window.logoutUser = function() {
    FB.logout(function(response) {
      debug('loggout')
      debug(response)
      $('#logged_in_view').hide();
      $('#login_logout_link').show();
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
      $('#logged_in_view').show();
      $('#login_logout_link').hide();

      // todo - refresh view ?
    } else {
      FB.api('/me?fields=id,first_name,last_name,email', function(response) {
        // User is logged in but need to get his configuration
        $.ajax({
         method: 'POST',
         url: "api/login-user",
         data: {
           'fb_id': response.id,
           'configuration': window.App,
           'first_name': response.first_name,
           'last_name': response.last_name,
           'email': response.email
         },
         success: function(result){
           $('#logged_in_view').show();
           $('#login_logout_link').hide();
           $('#user_name').text(getGreeting() + ", " + result.first_name);
           $('#login_image').find('img').attr('src', 'https://graph.facebook.com/' + result.id + '/picture?type=square');
           window.data.isLoggedIn = true;
           window.data.userInfo = result.configuration; // todo - ? laasot seder
debug('shshs')
debug(result)
           // todo - refresh view?
         },
         error: function(err) {
           console.log(err);
         }
       });
      });
    }
  };

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

  // Jquery elements and helper functions
  var $env = $('.env');
  var $tuneModal = $("#tune_modal");
  var $hoursInput = $('.wut_hours');
  var $minutesInput = $('.wut_minutes');
  var $wutDelimiter = $('.wut_delimiter')[0];
  var $timeToWakeUp = $('#time_to_wake_up');
  var $resetButton = $('#reset_button');
  var $snoozeButton = $('#snooze_settings_button');
  var $alarmFullScreen = $('.icon-enlarge');
  var $wakeUpModeTuneContainer = $('#wake_up_mode_tune_container');
  var $setAlarmContainer = $('#set_alarm_container');

  // Alarm window
  var $pauseContainer = $('.icon_pause_cont');
  var $snoozeContainer = $('.icon_snooze_cont');
  var $resetContainer = $('.icon_alarm_on_cont');

  // Helpers
  var updateDomTime = function(e) {
    var zeroBasedMinutes = e.minutes < 10 ? "0" + e.minutes : e.minutes;
    var zeroBasedHours = e.hours < 10 ? "0" + e.hours : e.hours;
    $minutesInput.val(zeroBasedMinutes);
    $hoursInput.val(zeroBasedHours);
    $timeToWakeUp.val(zeroBasedHours + ":" + zeroBasedMinutes);
  };
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
      source_mp4.setAttribute('src', 'https://dev.metaclock.local:80/muted-blank.mp4');
      source_mp4.setAttribute('type', 'video/mp4');
      this._video.appendChild(source_mp4);

      var source_ogg = document.createElement('source');
      source_ogg.setAttribute('src', 'https://dev.metaclock.local:80/muted-blank.ogv');
      source_ogg.setAttribute('type', 'video/ogg');
      this._video.appendChild(source_ogg);

      document.body.appendChild(this._video);
    },
    _video: null
  };

  // Init clock picker
  var options = function () {
    return {
      placement: 'top',
      default: $hoursInput.val() + ":" + $minutesInput.val(),
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
  $hoursInput.clockpicker(Object.assign(Object.assign({}, options()), {
    afterHourSelect: function (e) {
      updateDomTime(e);
    }
  }));
  $minutesInput.clockpicker(Object.assign(Object.assign({}, options()), {
    afterShow: function () {
      $minutesInput.clockpicker('toggleView', 'minutes');
    }
  }));
  $timeToWakeUp.clockpicker(Object.assign(Object.assign({}, options()), {
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
  $(document).on('click', '#time_to_wake_up', function() {
    $timeToWakeUp.clockpicker('show');

  });

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
  $hoursInput.inputFilter(inputFilterHelper(23, $hoursInput));
  $minutesInput.inputFilter(inputFilterHelper(59, $minutesInput));

  // Modals
  $tuneModal.iziModal({
    title: 'Select a tune',
    subtitle: 'You can select any tune, YouTube video or upload MP3',
    headerColor: '#1a91d2',
    width: 600,
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
        var $selected = $($tuneModal.find('.selected_tune')[0]);
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

        $tuneModal.iziModal('close');
      });

      $('#cancel_tune').on('click', function () {
        // TODO - change back to the previously selected tune
        $tuneModal.iziModal('close');
      });

      var $youtubeSearchResults = $('#youtube_search_results');
      $('#youtube_search').on('keyup', function (e) {
        if (e.keyCode !== 13) {
          return;
        }

        var value = $(this).val();
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
      });

    },
    onClosing: function() {
      playerPause();
    }
  });

  var toggleScreen = function() {
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
  };
  var playerPlay = function($elem) {
    $("#ubaplayer").ubaPlayer('play', $elem);
  };

  var playerPause = function() {
    try {
      $("#ubaplayer").ubaPlayer('pause');
    } catch(e) {}
  };

  var playerResume = function() {
    try {
      $("#ubaplayer").ubaPlayer('resume');
    } catch(e) {}
  };

  // Events handlers
  var resetView = function() {
    window.App.viewMode = 0;
    // todo - ?
    $wakeUpModeTuneContainer.hide();
    $setAlarmContainer.show();
    clearTimeout(window.App.timer);

    $(document).off('keypress.alarm');
    $(window).off('beforeunload.alarm');

    playerPause();
    $env.removeClass('night');
  };
  var chooseSnooze = function(elem) {
    var $elm = $(elem.currentTarget);
    $('.current_snooze').text($elm.text());
    $snoozeButton.find('li').removeClass('selected_snooze');
    $elm.addClass('selected_snooze');
  };
  var refreshClockView = function () {
    var minutes = parseInt($('.wut_minutes').val());
    var hours = parseInt($('.wut_hours').val());
    $minutesInput.clockpicker('refreshView', hours, minutes);
    $hoursInput.clockpicker('refreshView', hours, minutes);
  };
  var hourTriggerFocus = function (e) {
    if (e.target !== this && e.target !== $wutDelimiter) {
      return
    }

    setTimeout(function () {$hoursInput.trigger('focus')}, 0);
  };
  var openModal = function($modalTriggerElem) {
    return function () {
      $modalTriggerElem.iziModal('open');
    }
  };
  var loadEvent = function () {
    var $preloader = $('#preloader');
    $preloader.animate({'opacity': 0}, {
      complete: function () {
        $('#site_container').animate({'opacity': 1});
        $preloader.css('z-index', -1);
      }
    });
    $env.removeClass('hidden');

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
  };
  var tabsSwitchEvent = function () {
    var $tuneTabsContent = $('#tune_modal .tabs_content');
    var $this = $(this);
    if ($this.hasClass('active')) {
      return;
    }

    $tuneTabsContent.find('.' + $tuneModal.find('.active').attr('tab') + '_content').fadeOut(function () {
      $tuneTabsContent.find('.' + $this.attr('tab') + '_content').fadeIn(function () {
        if ($this.hasClass('tab_youtube')) {
          $('#youtube_search').focus();
        }
      });
    });
  };
  var setNightView = function(hours, minutes, wakeupTimeObj) {
    var wakeupTime = wakeupTimeObj.getMinutes() * 60 + wakeupTimeObj.getHours() * 60 * 60;

    window.App.viewMode = -1;

    $(window).bind("beforeunload.alarm",function() {
      return "Leaving this page will cancel your alarm. Are you sure?";
    });

    setInterval(function() {
      var time = calcMsDiffFromNow($hoursInput.val(),$minutesInput.val());
      var hours = time.getHours();
      var minutes = time.getMinutes();
      minutes = minutes < 10 ? "0" + minutes : minutes;
      hours = hours < 10 ? "0" + hours : hours;

      document.title = hours + ":" + minutes + " hours to wake up";
    }, 1000);

    sleep.prevent();
    $timeToWakeUp.val(hours + ":" + minutes);

    $env.addClass('night');
    $wakeUpModeTuneContainer.hide();
    playerPause();

    clearTimeout(window.App.timer);
    $(document).off('keypress.alarm');
    $(window).off('beforeunload.alarm');

    window.App.timer = setTimeout(function() {
      setWakingUpView();
    }, wakeupTime);
  };
  var setWakingUpView = function() {
    window.App.viewMode = 1;

    $(document).off('keypress.alarm');
    $(window).off('beforeunload.alarm');

    $setAlarmContainer.hide();
    $wakeUpModeTuneContainer.find('.wake_up_cont').hide();

    var $selectedTuneYT = $($('.tunes_list li.selected_tune, #youtube_search_results li.selected_tune')[0]);
    var isTune = $selectedTuneYT.parents(".tunes_list").length;

    $wakeUpModeTuneContainer.hide().removeClass('hidden');
    if (isTune) {
      var $tuneCont = $wakeUpModeTuneContainer.find('#wake_up_tune');
      $tuneCont.show();

      setTimeout(function() {
        if (window.App.viewMode === 0) {
          return;
        }
        $wakeUpModeTuneContainer.fadeIn("slow");
        playerPlay($('.selected_tune .ubaplayer-button'));
      }, 2000);

      $(document).on('keypress.alarm', function(e) {
        if ((e.keyCode === 0 || e.keyCode === 32) && window.App.viewMode === 1) {
          resetView();
          e.preventDefault();
        }
      });
    } else {
      var $ytCont = $wakeUpModeTuneContainer.find('#wake_up_youtube_video');
      $ytCont.show();
    }

    $env.removeClass('night');

    // TODO - Maybe a quote in the sky
  };
  var calcMsDiffFromNow = function(hours, minutes) {
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
  };

  var setAlarmEvent = function () {
    var hours = $hoursInput.val();
    var minutes = $minutesInput.val();

    var msDiff = calcMsDiffFromNow(hours,minutes);

    // todo - temp
    msDiff.setHours(0);
    msDiff.setMinutes(0);
    msDiff.setSeconds(4);
    //todo - temp

    setNightView(hours, minutes, msDiff);

  };

  // Events
  $('.wut_inner_container').on('focus click', hourTriggerFocus);

  $minutesInput.on('keyup focus', refreshClockView);

  $hoursInput.on('keyup focus', refreshClockView);

  $snoozeButton.find('li').on('click', chooseSnooze);

  $resetButton.on('click', resetView);

  $alarmFullScreen.on('click', toggleScreen);

  $(document).on('click', '.wu_tune', openModal($tuneModal));

  $(window).on('load', loadEvent);

  $(document).on('click', '.set_alarm_btn', setAlarmEvent);

  $('.tab_youtube, .tab_tune').on('click', tabsSwitchEvent);

  $("#ubaplayer").ubaPlayer({codecs: [{name:"MP3", codec: 'audio/mpeg;'}], loop: true});

  $(document).on('click','.tunes_list li, #youtube_search_results li',function(e) {
    $('.tunes_list li, #youtube_search_results li').removeClass('selected_tune');
    $(this).addClass('selected_tune');
    if ($(this).parent('.tunes_list').length) {
      $('#ok_tune').text('Use selected tune');
    } else {
      $('#ok_tune').text('Use selected video');
    }
  });

  $pauseContainer.on('click', function() {
    var $this = $(this);
    var $iconPause = $this.find('.icon-pause'),
        $iconPlay = $this.find('.icon-play2'),
        $desc = $this.find('.icon_desc');
    if ($iconPause.hasClass('hidden')) {
      $iconPlay.addClass('hidden');
      $iconPause.removeClass('hidden');
      $desc.text('Pause');
      playerResume();
    } else { // Pause is shown
      $iconPlay.removeClass('hidden');
      $iconPause.addClass('hidden');
      $desc.text('Play');
      playerPause();
    }
  });

  $resetContainer.on('click', resetView);

  $snoozeContainer.on('click', function() {
    window.App.viewMode = -1;
    var snoozeTextSplit = $('.current_snooze').text().split("Snooze in ");
    var snoozeTime = snoozeTextSplit.length !== 2 ? 5 : parseInt(snoozeTextSplit[1].split(" minutes")[0]);
    var now = new Date();
    var currentHours = now.getHours(), currentMinutes = now.getMinutes();
    var newMinutes = currentMinutes + snoozeTime >= 60 ? snoozeTime - (60 - currentMinutes) : currentMinutes + snoozeTime;
    var newHours = currentMinutes + snoozeTime >= 60 ? currentHours + 1 : currentHours;

    newMinutes = newMinutes < 10 ? "0" + newMinutes : newMinutes;
    newHours = newHours < 10 ? "0" + newHours : newHours;

    var msDiff = calcMsDiffFromNow(newHours, newMinutes);

    setNightView(newHours, newMinutes, msDiff)
  });
});

$('#site_container').css('opacity', 0);