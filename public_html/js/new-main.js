"use strict";
$(function () {
  var DEBUG_VERBOSITY_LEVEL = 2; // 0 - Nothing, 1 - Some, 2 - All

  // Application configuration
  window.AppSettings = {
    timer: null,
  };

  var debug = function(msg, verbosity) {
    verbosity = typeof verbosity === 'undefined' ? 2 : verbosity;
    if (verbosity === DEBUG_VERBOSITY_LEVEL) {
      console.log(msg);
    }
  };

  window.PopupCenter = function(url, title, w, h) {
    // Fixes dual-screen position                         Most browsers      Firefox
    var dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
    var dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;

    var width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
    var height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

    var systemZoom = width / window.screen.availWidth;
    var left = (width - w) / 2 / systemZoom + dualScreenLeft;
    var top = (height - h) / 2 / systemZoom + dualScreenTop;
    var newWindow = window.open(url, title, 'scrollbars=yes, width=' + w / systemZoom + ', height=' + h / systemZoom + ', top=' + top + ', left=' + left);

    // Puts focus on the newWindow
    if (window.focus) newWindow.focus();
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
  var $envWakeUp = $('.env_wakeup'); // TODO
  var $tuneModal = $("#tune_modal");
  var $hoursInput = $('.wut_hours');
  var $minutesInput = $('.wut_minutes');
  var $wutDelimiter = $('.wut_delimiter')[0];
  var $timeToWakeUp = $('#time_to_wake_up');
  var $resetButton = $('#reset_button');
  var $snoozeButton = $('#snooze_settings_button');
  var $alarmFullScreen = $('.icon-enlarge');

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
    } catch(e) {
      // throws an exception if not playing...
    }
  };

  var playerResume = function() {
    try {
      $("#ubaplayer").ubaPlayer('resume');
    } catch(e) {
      // throws an exception if not playing...
    }
  };

  // Events handlers
  var resetView = function() {
    // todo - ?
    $('#wake_up_mode_tune_container').hide();
    $('#set_alarm_container').show();
    clearTimeout(window.AppSettings.timer);
    playerPause();
    $env.removeClass('night');
  };

  var chooseSnooze = function(elem) {
    $('.current_snooze').text($(elem.currentTarget).text());
  };

  var refreshView = function () {
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

  var setAlarm = function(hours, minutes, secondsDiff) {
    $timeToWakeUp.val(hours + ":" + minutes);

    $env.addClass('night');

    var $wakeUpModeTuneContainer = $('#wake_up_mode_tune_container');
    $wakeUpModeTuneContainer.hide();
    playerPause();

    clearTimeout(window.AppSettings.timer);
    window.AppSettings.timer = setTimeout(function() {
      $('#set_alarm_container').hide();
      $wakeUpModeTuneContainer.find('.wake_up_cont').hide();

      var $selectedTuneYT = $($('.tunes_list li, #youtube_search_results li .selected_tune')[0]);
      var isTune = $selectedTuneYT.parents(".tunes_list").length;

      if (isTune) {
        var $tuneCont = $wakeUpModeTuneContainer.find('#wake_up_tune');
        $tuneCont.find('.item_title').text($selectedTuneYT.find('.item_title').text());
        $tuneCont.find('.item_desc').text($selectedTuneYT.find('.item_desc').text());
        $tuneCont.show();
        $wakeUpModeTuneContainer.hide().removeClass('hidden').delay(2000).fadeIn("slow");
        setTimeout(function() {
          playerPlay($('.selected_tune .ubaplayer-button'));
        }, 2000);

      } else {
        $wakeUpModeTuneContainer.hide().removeClass('hidden').delay(2000).fadeIn("slow");
      }

      $env.removeClass('night');

      // TODO - Maybe a quote in the sky
    }, secondsDiff);
  };

  var calcMsDiffFromNow = function(hours, minutes) {
    hours = parseInt(hours);
    minutes = parseInt(minutes);

    var now = new Date();
    var tomorrow = new Date();

    if ((now.getHours() > hours) || (now.getHours() === hours && now.getMinutes() > minutes)) {
      tomorrow.setDate(tomorrow.getDate() + 1);
    }

    tomorrow.setHours(hours);
    tomorrow.setMinutes(minutes);

    return (Math.abs(tomorrow - now) / 36e5) * 60 * 60 * 1000;
  };

  var setAlarmEvent = function () {
    var hours = $hoursInput.val();
    var minutes = $minutesInput.val();

    var msDiff = calcMsDiffFromNow(hours,minutes);

    msDiff = 2 * 1000; // todo - for debugging

    setAlarm(hours, minutes, msDiff);

  };

  // Events
  $('.wut_inner_container').on('focus click', hourTriggerFocus);

  $minutesInput.on('keyup focus', refreshView);

  $hoursInput.on('keyup focus', refreshView);

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
      $desc.text('Play');
      playerResume();
    } else { // Pause is shown
      $iconPlay.removeClass('hidden');
      $iconPause.addClass('hidden');
      $desc.text('Pause');
      playerPause();
    }
  });

  $resetContainer.on('click', resetView);

  $snoozeContainer.on('click', function() {
    var snoozeTextSplit = $('.current_snooze').text().split("Snooze in ");
    var snoozeTime = snoozeTextSplit.length !== 2 ? 5 : parseInt(snoozeTextSplit[1].split(" minutes")[0]);
    var now = new Date();
    var currentHours = now.getHours(), currentMinutes = now.getMinutes();
    var newMinutes = currentMinutes + snoozeTime >= 60 ? snoozeTime - (60 - currentMinutes) : currentMinutes + snoozeTime;
    var newHours = currentMinutes + snoozeTime >= 60 ? currentHours + 1 : currentHours;

    newMinutes = newMinutes < 10 ? "0" + newMinutes : newMinutes;
    newHours = newHours < 10 ? "0" + newHours : newHours;

    var msDiff = calcMsDiffFromNow(newHours, newMinutes);

    setAlarm(newHours, newMinutes, msDiff)
  });

  var sleep = {
    prevent: function() {
      if (!this._video) {
        this._init();
      }

      this._video.setAttribute('loop', 'loop');
      this._video.play();
    },
//    allow: function() {
//      if (!this._video) {
//        return;
//      }
//
//      this._video.removeAttribute('loop');
//      this._video.pause();
//    },
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
  sleep.prevent();
});

$('#site_container').css('opacity', 0);