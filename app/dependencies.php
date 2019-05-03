<?php
// DIC configuration
use App\Controller\HomeController;
use App\Controller\UserController;
use App\Models\DB;

$container = $app->getContainer();
// view renderer
$container['renderer'] = function ($c) {
    $settings = $c->get('settings')['renderer'];
    return new Slim\Views\PhpRenderer($settings['template_path']);
};
// monolog
$container['logger'] = function ($c) {
    $settings = $c->get('settings')['logger'];
    $logger = new Monolog\Logger($settings['name']);
    $logger->pushProcessor(new Monolog\Processor\UidProcessor());
    $logger->pushHandler(new Monolog\Handler\StreamHandler($settings['path'], $settings['level']));
    return $logger;
};
//$container['db'] = function ($c) {
//    return DB::instance($c);
//};
DB::init($container);
// Controllers !
$container['HomeController'] = function($c) {
    return new HomeController($c);
};

$container['UserController'] = function($c) {
    return new UserController($c);
};