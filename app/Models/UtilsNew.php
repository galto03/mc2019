<?php


namespace App\Models;


use Facebook\Exceptions\FacebookSDKException;
use Facebook\Facebook;

class UtilsNew {


    /**
     * @return Facebook|null
     */
    public static function getFacebook() {
        try {
            return new Facebook([
              'app_id' => '323484318322219',
              'app_secret' => 'a8cea2d0d284b8e3cbb64b68322bef33',
            ]);
        } catch (FacebookSDKException $e) {
            return null;
        }
    }
}