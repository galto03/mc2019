<?php
/**
 * Created by PhpStorm.
 * User: Tomer
 * Date: 23/07/17
 * Time: 1:26
 */

namespace App\Controller;


use App\Models\User;
use MartynBiz\Slim3Controller\Controller;

class PrivacyController extends Controller
{

    public function dispatch()
    {
        $fbId = User::refreshSessionsAndGetIndexIfPossible();

        $settings = ($fbId === null) ? [] : User::getData($fbId);

        return $this->render('privacy.min.phtml',[
            'userData' => $settings,
            'initValues' => [
                'people_count' => User::getPeopleCount()
            ]
        ]);
    }
}