<?php
/**
 * Created by PhpStorm.
 * User: Tomer
 * Date: 27/03/17
 * Time: 13:18
 */
namespace App\Models;


use App\Controller\UtilsNew;
use Exception;
use Facebook\Exceptions\FacebookSDKException;
use Facebook\Facebook;
use Facebook\Facebook\Exceptions\FacebookResponseException;

class UserNew extends Model
{
    public static function createNew($id, $firstName, $lastName, $email, $settings) {
        $params = [
          ':fbid' =>  $id,
          ':fname' => $firstName,
          ':lname' => $lastName,
          ':email' => $email,
          ':settings' => json_encode($settings),
        ];

        try {
            $query = DB::instance()->prepare("INSERT INTO users(fb_id, first_name, last_name, email, settings, created) " .
              "VALUES(:fbid, :fname, :lname, :email, :settings, CURRENT_TIMESTAMP);");
            $bool = $query->execute($params);
        } catch (Exception $e) {
            // todo
        }


        // TODO - send email to me

        return $bool;
    }

    /**
     * @param $id
     *
     * @return array|null
     */
    public static function getUser($id) {
        try {
            $sth = DB::instance()->prepare("SELECT * FROM users WHERE fb_id = :id");
            $sth->bindParam(':id', $id);
            $sth->execute();
            $res = $sth->fetch();

            return $res;
        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * @param Facebook $fb
     *
     * @return array|null
     */
    public static function getUserInfoUsingAccessToken($fb) {
        $accessToken = null;
        $userInfo = null;
        $helper = $fb->getJavaScriptHelper();

        try {
            $accessToken = $helper->getAccessToken();
        } catch (FacebookSDKException $e) {
            return null;
        }
        if (!$accessToken) {
            return null;
        }

        try {
            $fbDetails = $fb->get('/me?fields=id', $accessToken);
            $fbDetails = $fbDetails->getGraphUser()->asArray();
        } catch (FacebookSDKException $e) {
            return null;
        }
        $userInfo = self::getUser($fbDetails['id']);
        $userInfo = empty($userInfo) ? null : $userInfo;

        return $userInfo;
    }

    public static function saveSettings($fb, $settings) {
        $userInfo = UserNew::getUserInfoUsingAccessToken($fb);
        if (!$userInfo) {
            return false;
        }
        //todo

    }
}