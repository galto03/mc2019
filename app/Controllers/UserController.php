<?php
/**
 * Created by PhpStorm.
 * User: Tomer
 * Date: 27/03/17
 * Time: 18:57
 */

namespace App\Controller;


use App\Models\AppException;
use App\Models\DB;
use App\Models\MCFacebook;
use App\Models\User;
use finfo;
use MartynBiz\Slim3Controller\Controller;

class UserController extends Controller
{

    public function login() {

    }

    public function uploadTune() {
        $data = $this->request->getUploadedFiles();

        try {
            /**
             * @var $uploadedFile \Slim\Http\UploadedFile
             */
            if (!isset($_SESSION['user_id']))
                throw new AppException("You are not logged-in");

            $uploadedFile = $data['files'][0]->getClientFilename() === "" ? $data['files'][1] : $data['files'][0];
            $name = $uploadedFile->getClientFilename();
            switch ($uploadedFile->getError()) {
                case UPLOAD_ERR_NO_FILE: { throw new AppException("No file was uploaded."); break; }
                case UPLOAD_ERR_EXTENSION: { throw new AppException("Extension not supported."); break; }
                default: {}
            }

            $userDir = $_SERVER['DOCUMENT_ROOT']  . DIRECTORY_SEPARATOR . "uploads" . DIRECTORY_SEPARATOR . $_SESSION['user_id'];
            $path = $userDir . DIRECTORY_SEPARATOR . $name;

            if (!in_array(pathinfo($path, PATHINFO_EXTENSION),['mp3','mpeg']))
                throw new AppException("Only mp3 files are permitted.");

            if ($uploadedFile->getSize() > 4000000) // 4mb
                throw new AppException("The file is too large.");


            if ($uploadedFile->getError() !== 0) {
                throw new AppException("An error occurred.");
            }




            if (!file_exists($userDir)) // Means no songs ever uploaded
            {
                mkdir($userDir, 0777, true);
            } else {
                // Delete before insert
                $files = glob($userDir . '/*'); // get all file names
                foreach($files as $file){ // iterate files
                    if(is_file($file))
                        unlink($file); // delete file
                }
            }

            $uploadedFile->moveTo($path);

        } catch(\Exception $e) {
            return $this->response->withJson($e->getMessage());
        }
        return $this->response->withJson([
            'success' => 1,
            'fileName' => $name
        ]);
    }

    public function getUserFile() {
        if (!isset($_SESSION['user_id']))
            throw new AppException("Not logged in.");
        $uid = $_SESSION['user_id'];
        $userDir = $_SERVER['DOCUMENT_ROOT']  . DIRECTORY_SEPARATOR . "uploads" . DIRECTORY_SEPARATOR . $uid;
        if (!file_exists($userDir))
            return $this->response->withJson(false);

        $files = scandir($userDir);

        if (count($files) < 3) {
            return $this->response->withJson(false);
        } else {
            return $this->response->withJson([
                'fileName' => $files[2]
            ]);
        }
    }

//    public function refreshStatus() {
//        // User has an account, we DISCARD everything he did and LOAD his current settings.
//
//        //TODO: FOR THIS TO WORK PROPERLY, NEEDS SSL
//        $preData = $this->request->getParsedBody()['params'];
//        MCFacebook::refreshAccessTokenAndUserId($preData['accessToken'], $preData['userID']);
//        try {
//            $settings = User::getLoggedInUser()->getData();
//            return $this->response->withJson($settings);
//        } catch (AppException $e) {
//            return $this->response->withJson(null);
//        }
//    }


    public function loginAsUser() {
        $params = $this->request->getQueryParams()['params'];
        $userID = $params['id'];

        $sth = DB::instance()
            ->prepare("SELECT * FROM users WHERE id = :id");
        $sth->bindParam(':id', $userID);
        $sth->execute();
        $results = $sth->fetchAll();

        $_SESSION['user_id'] = $results[0]['fbid'];

        $data = User::getData($results[0]['fbid']);

        return $this->response->withJson($data);
    }

    public function completeLogin() {
        $preData = $this->request->getParsedBody()['params'];

        $userID = $preData['authResponse']['userID'];
        $accessToken = $preData['authResponse']['accessToken'];
        $_SESSION['user_access_token'] = $accessToken;
        $_SESSION['user_id'] = $userID;

        $isNewUser = false;

        $fbBody = null;
        if (!User::exists($userID)) {
            $fb = MCFacebook::getFacebook();
            $me = $fb->get('/me?fields=id,first_name,last_name,email, picture.type(square)', $accessToken);
            $fbBody = $me->getDecodedBody();
            $preData['user']['is_logged_in'] = true;
            $preData['user']['fbid'] = $fbBody['id'];
            $preData['user']['firstname'] = $fbBody['first_name'];
            $preData['user']['lastname'] = $fbBody['last_name'];
            $preData['user']['picture'] = $fbBody['picture']['data']['url'];
            $preData['user']['email'] = array_key_exists('email',$fbBody) ? $fbBody['email'] : NULL;

            User::create($preData['user'], $preData['data']['settings'], $preData['data']['todo'], $preData['data']['alarms'], $preData['data']['tune']);
            $isNewUser = true;
        }

        $data = User::getData($userID);
        $data['is_new_user'] = $isNewUser;
        if (empty($data['user']['picture'])) {
            if ($fbBody === null) {
                $me = MCFacebook::getFacebook()->get('/me?fields=id,first_name,last_name,email, picture.type(square)', $accessToken);
                $fbBody = $me->getDecodedBody();
                User::updateImageUrl($userID, $fbBody['picture']['data']['url']);
                $data['user']['picture'] = $fbBody['picture']['data']['url'];
            }
        }

        return $this->response->withJson($data);
    }

    public function updateTodos() {
        $preData = $this->request->getParsedBody()['params'];
        $userID = $preData['user']['fbid'];
        if (!array_key_exists('todo', $preData)) {
            // No todos
            $todos = [];
        } else {
            $todos = $preData['todo'];
        }
        User::updateTodos($userID, $todos);
        return $this->response->withJson(true);

    }
    public function updateSettings() {
        $preData = $this->request->getParsedBody()['params'];
        $userID = $preData['user']['fbid'];
        $settings = $preData['settings'];
        User::updateSettings($userID, $settings);
        return $this->response->withJson(true);
    }

    public function updateTune() {
        $params = $this->request->getParsedBody()['params'];
        $tune = $params['data'];
        $alarmId = $params['alarm_id'];
        $userID = $_SESSION['user_id'];
        User::updateTune($userID, $tune, $alarmId);
        return $this->response->withJson(true);
    }

    public function wakeUp() {
        $preData = $this->request->getParsedBody()['params'];
        $userID = $preData['user']['fbid'];
        if (User::exists($userID)) {
            User::saveEndAlarm($userID, $preData['settings'], $preData['todo'], $preData['alarms'], $preData['tune']);
        }
        return $this->response->withJson(true);
    }

    /**
     * @return null | int - returns null if the user is not logged in (the alarm won't be saved and therefore no ID)
     */
    public function setAlarm() {
        $preData = $this->request->getParsedBody()['params'];
        $userID = $preData['user']['fbid'];
        $alarmID = null;
        if (!array_key_exists('todo', $preData)) {
            // No todos
            $preData['todo'] = [];
        }
        if (!empty($userID) && User::exists($userID)) {
            $alarmID = User::saveStartAlarm($userID, $preData['settings'], $preData['todo'], $preData['alarms'], $preData['tune']);
        }
        return $this->response->withJson($alarmID);
    }

    public function incrementSnooze() {
        $preData = $this->request->getParsedBody()['params'];
        $userID = $preData['user']['fbid'];
        $alarmID = $preData['alarms']['pre_alarm']['alarm_id'];
        $alarmID = empty($alarmID) ? null : $alarmID;
        $didIncrement = false;
        if (!empty($alarmID) && !empty($userID) && User::exists($userID))
            $didIncrement = User::incrementSnooze($alarmID, $userID);

        return $this->response->withJson($didIncrement);
    }

    public function fireAlarm() {
        $preData = $this->request->getParsedBody()['params'];
        $userID = $preData['user']['fbid'];
        if (!array_key_exists('todo', $preData)) {
            // No todos
            $preData['todo'] = [];
        }
        if (User::exists($userID)) {
            User::saveFireAlarm($userID, $preData['settings'], $preData['todo'], $preData['alarms'], $preData['tune']);
        }
        return $this->response->withJson(User::getAlarmHistory($userID));
    }

    public function completeLogout() {
        $_SESSION['user_access_token'] = null;
        unset($_SESSION['user_access_token']);
        $_SESSION['user_id'] = null;
        unset($_SESSION['user_id']);
        MCFacebook::removeFbSessions();

        return $this->response->withJson(true);
    }

    public function deleteFromHistory() {
        $preData = $this->request->getParsedBody()['params'];
        $userID = $preData['fbid'];
        $alarmID = $preData['alarm_id'];
        if (User::exists($userID)) {
            User::deleteFromHistory($userID, $alarmID);
        }
        return $this->response->withJson(true);
    }

}