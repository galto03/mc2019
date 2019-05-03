<?php
/**
 * Created by PhpStorm.
 * User: Tomer
 * Date: 29/03/17
 * Time: 17:21
 */

namespace App\Models;


class Utils
{

    static public function formatIndex($value) {
        return $value;
    }

    public static function sendEmail($fullName, $params) {
        require  __DIR__ . '/../vendor/phpmailer/phpmailer/PHPMailerAutoload.php';

        $mail = new \PHPMailer();

        $mail->setFrom('admin@metaclock.com', 'MetaClock.com');
        $mail->addAddress('galtom007@gmail.com');
        $mail->addReplyTo('no-reply@metaclock.com', 'MetaClock.com');

        $mail->Subject = 'New user registered: ' . $fullName;
        $mail->Body    = json_encode($params);
        $mail->send();
    }

}