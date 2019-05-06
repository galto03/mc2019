"use strict";
(function() {

    $(document).ready(function() {
        window.mode = 1; // 1 = Day, 0 = In progress, -1 = Night

        var $circle = $('#circle-dyn');
        var $sky = $('#sky-dyn');
        var $todo = $('#todo-dyn');
        var $logo = $('#logo');
        var $ground = $('#ground-dyn');
        var $alarmSettings = $('#alarm-settings');
        var $alarmSet = $('#alarm-set-cont');

        var DURATION = 800;
        var DELAY_TIME = 0;
        var FADE_OUT_TIME = 100;

        window.toggleMode = function() {

            if (mode === 0) {
                return;
            }

            if (window.mode === 1) {

                $alarmSettings.fadeOut("fast", function() {
                    $circle.animate({top: '-1000px'}, {
                        duration: DURATION,
                        easing: "swing",
                        complete:  function() {

                            $logo.fadeOut(FADE_OUT_TIME).delay(DELAY_TIME).fadeIn("slow");
                            $ground.fadeOut(FADE_OUT_TIME, function() { $ground.addClass('night'); }).delay(DELAY_TIME).fadeIn("slow");

                            $sky.fadeOut(FADE_OUT_TIME, function() { $sky.addClass('night'); }).delay(DELAY_TIME).fadeIn("slow", function() {
                                // Moon goes down
                                $circle.addClass('night');


                                $circle.animate({top: '-70px'}, {
                                    duration: DURATION,
                                    easing: "swing",
                                    complete:  function() {
                                        $alarmSet.fadeIn("fast");
                                        window.mode = -1;
                                    }
                                });
                            });
                        }
                    });
                });
            } else {
                $alarmSet.fadeOut("fast", function() {
                    $circle.animate({top: '-1000px'}, {
                        duration: DURATION,
                        easing: "swing",
                        complete:  function() {

                            $logo.fadeOut(FADE_OUT_TIME).delay(DELAY_TIME).fadeIn("slow");
                            $ground.fadeOut(FADE_OUT_TIME, function() { $ground.removeClass('night'); }).delay(DELAY_TIME).fadeIn("slow");

                            $sky.fadeOut(FADE_OUT_TIME, function() { $sky.removeClass('night'); }).delay(DELAY_TIME).fadeIn("slow", function() {
                                // Sun goes down
                                $circle.removeClass('night');
                                $circle.animate({top: '-70px'}, {
                                    duration: DURATION,
                                    easing: "swing",
                                    complete:  function() {
                                        $alarmSettings.fadeIn("fast");
                                        window.mode = 1;
                                    }
                                });
                            });
                        }
                    });
                });
            }

            // if (window.mode === 1) {
            //     $alarmSettings.fadeOut("fast", function() {
            //         $circle.animate({top: '-1000px'}, {
            //             duration: duration,
            //             easing: "swing",
            //             complete:  function() {
            //                 $sky.addClass('night');
            //                 $ground.addClass('night');
            //                 $circle.addClass('night');
            //                 $ground.fadeIn("slow");
            //                 $sky.fadeIn("slow");
            //                 $logo.fadeIn("fast");
            //                 $circle.animate({top: '-70px'}, {
            //                     duration: duration,
            //                     easing: "swing",
            //                     complete:  function() {
            //                         window.mode = -1;
            //                         $alarmSet.fadeIn("fast");
            //                     }
            //                 });
            //             }
            //         });
            //     });
            //
            //     $todo.delay(100).animate({left: '-1000px'}, {
            //         duration: duration,
            //         easing: "swing",
            //         complete:  function() {
            //             $todo.addClass('night');
            //             $todo.animate({left: '10%'}, {
            //                 duration: duration,
            //                 easing: "swing",
            //                 complete:  function() {
            //
            //                 }
            //             });
            //         }
            //     });
            // } else {
            //     $alarmSet.fadeOut("slow");
            //     $circle.animate({top: '-1000px'}, {
            //         duration: duration,
            //         easing: "swing",
            //         complete:  function() {
            //             $sky.removeClass('night');
            //             $ground.removeClass('night');
            //             $sky.fadeIn("slow");
            //             $logo.fadeIn("fast");
            //             $ground.fadeIn("slow");
            //             $circle.removeClass('night');
            //             $circle.animate({top: '-70px'}, {
            //                 duration: duration,
            //                 easing: "swing",
            //                 complete:  function() {
            //                     window.mode = 1;
            //                     $alarmSettings.fadeIn("fast");
            //                 }
            //             });
            //         }
            //     });
            //     $todo.delay(100).animate({left: '-1000px'}, {
            //         duration: duration,
            //         easing: "swing",
            //         complete:  function() {
            //             $todo.removeClass('night');
            //             $todo.animate({left: '10%'}, {
            //                 duration: duration,
            //                 easing: "swing",
            //                 complete:  function() {
            //
            //                 }
            //             });
            //         }
            //     });
            // }

        };

        $('#set-alarm-btn').on('click', function() {
            window.toggleMode();
        })
    })
})();