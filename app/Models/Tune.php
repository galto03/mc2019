<?php
/**
 * Created by PhpStorm.
 * User: Tomer
 * Date: 25/06/17
 * Time: 11:40
 */

namespace App\Models;


use PDO;

class Tune
{
    static private $likes = [
        1 => 824,
        2 => 433,
        3 => 911,
        4 => 332,
        5 => 600,
        6 => 912,
        7 => 663,
        8 => 1063,
        9 => 885,
        10 => 1012,
        11 => 833,
        12 => 544,
        13 => 533,
        14 => 733,
        15 => 664,
        18 => 688,

    ];

    static public function getDetails($tuneID) {
        $query = DB::instance()->prepare("SELECT * FROM tunes WHERE id = :tuneid");
        $ret = $query->execute([
            ':tuneid' => $tuneID
        ]);

        return $ret;
    }

    static public function getLikeCount($tuneID) {
        $query = DB::instance()->prepare("SELECT count(*) as likes FROM tunes_has_likes WHERE idtune = :tuneid");
        $query->execute([
            ':tuneid' => $tuneID
        ]);

        $ret = $query->fetch();

        return $ret['likes'];
    }

    static public function getTuneObject($tuneID) {
        $tuneID = intval($tuneID);
        $query = DB::instance()->prepare("SELECT  tunes.*, count(*) as likes FROM tunes_has_likes as thl INNER JOIN tunes ON id = thl.idtune WHERE thl.idtune = :tuneid GROUP BY id");
        $query->execute([
            ':tuneid' => $tuneID
        ]);

        $ret = $query->fetch();

        if ($ret === false) {
            // No results, happens if tunes_has_likes doesn't have tuneID
            $tuneID = intval($tuneID);
            $query = DB::instance()->prepare("SELECT  * FROM tunes WHERE id = :tuneid");
            $query->execute([
                ':tuneid' => $tuneID
            ]);
            $ret = $query->fetch();
            $ret['likes'] = 0;
        }

        $ret['likes'] = intval($ret['likes']) + self::$likes[$ret['id']];
        return $ret;
    }

    /**
     * @param $tuneID
     * @param User $user
     * @return bool
     */
    static public function likeTune($tuneID, User $user) {
        $userID = $user->getFbID();
        if (Tune::didLiked($tuneID,$user))
            return false;

        $query = DB::instance()->prepare("INSERT INTO tunes_has_likes (idtune, iduser) VALUES (:tuneid, :userid)");
        $ret = $query->execute([
            ':tuneid' => $tuneID,
            ':userid' => $userID
        ]);

        return $ret;
    }

    /**
     * @param $tuneID
     * @param User $user
     * @return bool
     */
    static public function unlikeTune($tuneID, User $user) {
        $userID = $user->getFbID();
        if (!Tune::didLiked($tuneID,$user))
            return false;

        $query = DB::instance()->prepare("DELETE FROM tunes_has_likes WHERE idtune = :tuneid AND iduser = :userid");
        $query->execute([
            ':tuneid' => $tuneID,
            ':userid' => $userID
        ]);

        $res = $query->fetchAll(PDO::FETCH_ASSOC);

        return $res;
    }

    /**
     * @param $tuneID
     * @param User $user
     * @return bool
     */
    public static function didLiked($tuneID, User $user)
    {
        $query = DB::instance()->prepare("SELECT * FROM tunes_has_likes WHERE idtune = :tuneid AND iduser = :userid;");
        $query->execute([
            ':tuneid' => $tuneID,
            ':userid' => $user->getFbID()
        ]);
        $ret = $query->fetchAll(PDO::FETCH_ASSOC);

        return count($ret) !== 0;

    }

    /**
     * @return array
     */
    public static function getAllLikeCount()
    {
        $query = DB::instance()->prepare("
        SELECT tunes.*, tunes_has_likes.likes
        FROM tunes
        INNER JOIN (SELECT idtune, count(idtune) as likes
        FROM tunes_has_likes
        GROUP BY idtune) tunes_has_likes ON tunes_has_likes.idtune = tunes.id");
        $query->execute();
        $ret = $query->fetchAll(PDO::FETCH_ASSOC);

        $retFormatted = [];
        foreach($ret as $key => $val) {
            $val['likes'] = intval($val['likes']) + self::$likes[$val['id']];
            $retFormatted[$val['id']] = $val;
        }

        return $retFormatted;
    }

    /**
     * @return array
     */
    public static function getUserLikes()
    {
        if (User::isLoggedIn())
            $user = User::getLoggedInUser();
        else
            return [];

        $query = DB::instance()->prepare("SELECT idtune FROM tunes_has_likes WHERE iduser = :userid");
        $query->execute([
            ':userid' => $user->getFbID()
        ]);
        $ret = $query->fetchAll(PDO::FETCH_ASSOC);

        $retFormatted = [];
        foreach($ret as $key => $val) {
            array_push($retFormatted,$val['idtune']);
        }
        return $retFormatted;
    }
}