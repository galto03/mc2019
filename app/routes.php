<?php

$app->group('', function () use ($app) {
    $controller = new App\Controller\HomeController($app);
    $privacyCtrl = new App\Controller\PrivacyController($app);
    $stopwatch = new App\Controller\StopwatchController($app);

    $app->get('/', $controller('dispatch'));
    $app->get('/before', $controller('beforeDispatch'));

    $app->get('/stopwatch', $stopwatch('dispatch'));
    $app->get('/privacy', $privacyCtrl('dispatch'));

    $app->get('/old', $controller('oldmetaclock'));
    $app->post('/old/ajax', $controller('oldmetaclockajax'));

    $app->get('/test-player', $controller('testplayer'));


    // New added
});




$app->group('/api', function () use ($app) {
    $controller = new App\Controller\HomeController($app);
    $userController = new App\Controller\UserController($app);
    $userNewController = new App\Controller\UserNewController($app);
    $likeController = new App\Controller\LikeController($app);

    $app->post('/complete-login', $userController('completelogin'));
//    $app->post('/refresh-user-status', $userController('refreshstatus'));
    $app->get('/complete-logout', $userController('completelogout'));
    $app->post('/set-alarm', $userController('setalarm'));
    $app->post('/inc-snooze', $userController('incrementsnooze'));
    $app->post('/fire-alarm', $userController('firealarm'));
    $app->post('/wake-up', $userController('wakeup'));
    $app->post('/update-todos', $userController('updatetodos'));
    $app->post('/update-settings', $userController('updatesettings'));
    $app->post('/update-tunes', $userController('updatetune'));

    $app->post('/upload-tune', $userController('uploadtune'));
    $app->get('/get-user-file', $userController('getuserfile'));
    $app->get('/get-quotes', $controller('getquotes'));
    $app->get('/get-random-quote', $controller('getrandomquote'));
    $app->get('/just-woke-up', $controller('getjustwokeup'));
    $app->get('/get-likes', $likeController('getalllikes'));

    $app->post('/like-tune', $likeController('liketune'));
    $app->post('/unlike-tune', $likeController('disliketune'));

    $app->get('/remove-recent-alarms', $controller('removerecentalarms'));

    $app->post('/log-error', $controller('logerror'));

    $app->get('/login-as-user-9622', $userController('loginasuser'));


    // New added
//    $app->get('/login', $userController('login'));
    $app->post('/get-user', $userNewController('getuser'));



});
