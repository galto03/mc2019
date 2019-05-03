<?php
/**
 * Created by PhpStorm.
 * User: Tomer
 * Date: 25/06/17
 * Time: 11:36
 */

namespace App\Controller;


use App\Models\DB;
use App\Models\Tune;
use App\Models\User;
use MartynBiz\Slim3Controller\Controller;

class LikeController extends Controller
{
    public function likeTune() {
        $data = $this->request->getParsedBody()['params'];
        $tuneID = $data['tune_id'];

        if (!User::isLoggedIn())
            return false;

        $user = User::getLoggedInUser();

        $didLiked = Tune::didLiked($tuneID, $user);

        if (!$didLiked)
            Tune::likeTune($tuneID, $user);

        return $this->response->withJson(Tune::getTuneObject($tuneID));
    }
    public function dislikeTune() {
        $data = $this->request->getParsedBody()['params'];
        $tuneID = $data['tune_id'];

        if (!User::isLoggedIn())
            return false;

        $user = User::getLoggedInUser();

        $didLiked = Tune::didLiked($tuneID, $user);

        if ($didLiked)
            Tune::unlikeTune($tuneID, $user);

        return $this->response->withJson(Tune::getTuneObject($tuneID));
    }

    public function getLikeCountForTuneId() {
        $data = $this->request->getParsedBody()['params'];
        $tuneID = $data['tune_id'];

        return $this->response->withJson(Tune::getLikeCount($tuneID));

    }

    public function getAllLikes() {
        return $this->response->withJson([
            'likesArray' => Tune::getAllLikeCount(),
            'userLikes' => Tune::getUserLikes()
        ]);
    }

}