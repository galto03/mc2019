<?php
/**
 * Created by PhpStorm.
 * User: Tomer
 * Date: 27/03/17
 * Time: 13:18
 */
namespace App\Models;


use Exception;
use PDO;
use RKA\Session;
use Slim\Http\Request;
use Slim\Http\Response;

class UserNew extends Model
{
    public static function createNew($id, $firstName, $lastName, $email, $configuration) {
        $params = [
          ':fbid' =>  $id,
          ':fname' => $firstName,
          ':lname' => $lastName,
          ':email' => $email,
          ':configuration' => $configuration,
        ];

        try {
            $query = DB::instance()->prepare("INSERT INTO users(fb_id, first_name, last_name, email, configuration, created) " .
              "VALUES(:fbid, :fname, :lname, :email, :configuration, CURRENT_TIMESTAMP);");
            $bool = $query->execute($params);
        } catch (Exception $e) {
            // todo
        }


        // TODO - send email to me

        return $bool;
    }

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
}