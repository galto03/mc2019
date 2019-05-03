<?php
/**
 * Created by PhpStorm.
 * User: Tomer
 * Date: 26/03/17
 * Time: 17:04
 */

namespace App\Models;

use Facebook\Authentication\AccessToken;
use Facebook\Facebook;

class MCFacebook
{
    const FBID = '436904686351641';
    const DEFAULT_GRAPH_API = 'v2.8';
    const APP_SECRET = 'e05e61d469e87df656c9c361f1651835';
    const FB_TOKEN_COOKIE_NAME = 'fbsr_' . self::FBID;
    static $fb = null;

    /**
     * @return Facebook
     */
    public static function getFacebook() {
        if (self::$fb === null)
            self::$fb = new Facebook([
                'app_id' => self::FBID,
                'app_secret' => self::APP_SECRET,
                'default_graph_version' => self::DEFAULT_GRAPH_API,
                'persistent_data_handler'=>'session'
            ]);

        return self::$fb;
    }

    public static function setAccessTokenSession($at) {
        $_SESSION['fb_access_token'] = $at;
    }
    public static function setFacebookIdSession($fbid) {
        $_SESSION['fb_user_id'] = $fbid;
    }

    public static function isAccessTokenExpired() {
        if (!self::hasFbSessions())
            return false;

        $at = self::getAccessTokenSession();

        return $at->isExpired();
    }

    /**
     * @return AccessToken
     */
    public static function getAccessTokenSession() {
        return $_SESSION['fb_access_token'];
    }

    public static function getUserId() {
        return $_SESSION['fb_user_id'];
    }

    public static function hasAccessTokenSession() {
        return isset($_SESSION['fb_access_token']) && !is_null($_SESSION['fb_access_token']);
    }

    public static function hasUserIdSession() {
        return isset($_SESSION['fb_user_id'])&& !is_null($_SESSION['fb_user_id']);
    }

    public static function hasFbSessions() {
        return self::hasAccessTokenSession() && self::hasUserIdSession();
    }

    public static function removeAccessTokenSession() {
        unset($_SESSION['fb_access_token']);
    }

    public static function removeUserIdSession() {
        unset($_SESSION['fb_user_id']);
    }



    /**
     * @param $newAccessToken
     * @param $newUserId
     */
    public static function refreshAccessTokenAndUserId($newAccessToken, $newUserId)
    {
//        $fb = self::getFacebook();
        try {
            if (!isset($_SESSION['fb_access_token']) || $_SESSION['fb_access_token'] === null)
                self::setAccessTokenSession($newAccessToken);
            if (!isset($_SESSION['fb_user_id']) || $_SESSION['fb_user_id'] === null)
                self::setFacebookIdSession($newUserId);
        }
        catch(\Exception $e)
        {
            self::removeFbSessionAndCookie();
        }
    }

    public static function isConnected()
    {
        try {
            $fb = self::getFacebook();
            $jsHelper = $fb->getJavaScriptHelper();
            return $jsHelper->getUserId() !== null;
        } catch (\Exception $e) {
            return false;
        }
    }

    public static function removeFbSessions()
    {
        self::removeAccessTokenSession();
        self::removeUserIdSession();
    }

    public static function removeFbSessionAndCookie()
    {
        self::removeFbSessions();
        unset($_COOKIE[MCFacebook::FB_TOKEN_COOKIE_NAME]);
    }


}