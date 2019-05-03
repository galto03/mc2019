<?php
/**
 * Created by PhpStorm.
 * User: Tomer
 * Date: 23/06/17
 * Time: 15:09
 */

namespace App\Controller;


use MartynBiz\Slim3Controller\Controller;

class StopwatchController extends Controller
{

    public function dispatch() {
        $settings = [];
        return $this->render('stopwatch.phtml',[
            'userData' => $settings
        ]);
    }

}