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

class User extends Model
{
    /**
     * @var string
     */
    private $fbID;
    private $details = [];

    /**
     * @param string|null $fbid
     * @throws \ErrorException
     */
    public function __construct($fbid) {
        if (null === $fbid)
            throw new \ErrorException("Null facebook id in User constructor");

        $this->fbID = $fbid;
    }

    public static function isLoggedIn() {
        self::refreshSessionsAndGetIndexIfPossible();
        return isset($_SESSION['user_id']);
    }

    /**
     * Returns the logged in user OR null if not logged in.
     * Also saves the session
     * @return User|null
     */
    public static function getLoggedInUser()
    {
        try {
            return new User(self::getSessionUserId());
        } catch (Exception $e) {
            return null;
        }
    }

    public static function updateSettings($userID, $settings) {

        $query = DB::instance()->prepare("UPDATE users SET settings = :settings WHERE fbid = :fbid;");
        $query->execute([
            ':settings' => json_encode($settings),
            ':fbid' => $userID
        ]);

    }

    public static function updateImageUrl($userID, $url) {
        $query = DB::instance()->prepare("UPDATE users SET picture = :picture WHERE fbid = :fbid");
        $query->execute([
            ':fbid' => $userID,
            ':picture' => $url
        ]);
    }

    public static function create($user,$settings, $todos, $alarm, $tune) {
        $pdo = DB::instance();
        $pdo->beginTransaction();
        $params = [
            ':fbid' =>  Utils::formatIndex($user['fbid']),
            ':fname' => $user['firstname'],
            ':lname' => $user['lastname'],
            ':email' => $user['email'],
            ':settings' => json_encode($settings),
        ];

        try {
            // User
            $query = $pdo->prepare("INSERT INTO users(fbid, firstname, lastname, email, settings, last_login) VALUES(:fbid, :fname, :lname, :email, :settings, CURRENT_TIMESTAMP);");
            $query->execute($params);

            // Todos
            foreach($todos as $key => $todo) {
                $query = $pdo->prepare("INSERT INTO todos(fbid, priority, listindex, text, is_done) VALUES(:fbid, :priority, :index, :text, :is_done);");
                $query->execute([
                    ':fbid' =>  Utils::formatIndex($user['fbid']),
                    ':priority' => $todo['priority'],
                    ':index' => $key+1,
                    ':text' => $todo['text'],
                    ':is_done' => $todo['is_done'] === "0" || $todo['is_done'] === "false" ? 0 : 1,
                ]);
            }

            // Alarm
            $fields = ['fbid', 'settings', 'time_setted', 'alarm_time',
                'snooze_times', 'snooze_duration', 'did_wake_up', 'snoozes_used', 'tune_type', 'tune_data'];

            $values = [];
            foreach($fields as $field) { array_push($values,":" . $field); }
            $params = [
                'fbid' => Utils::formatIndex($user['fbid']),
                'settings' => json_encode($settings),
                'time_setted' => is_null($alarm['pre_alarm']['time_setted']) || $alarm['pre_alarm']['time_setted'] === '' ? date("Y-m-d H:i:s") : $alarm['pre_alarm']['time_setted'], // YYYY/MM/DD HH:mm:ss
                'alarm_time' => $alarm['pre_alarm']['alarm_time'], // HH:mm:ss
                'snooze_times' => intval($settings['clock']['snooze_times']),
                'snooze_duration' => intval($settings['clock']['snooze_duration']),
                'did_wake_up' => $alarm['post_alarm']['did_wake_up'] === 'false' ? 0 : 1,
                'snoozes_used' => intval($alarm['post_alarm']['snoozes_used']),
                'tune_type' => $tune['tune_type'],
                'tune_data' => json_encode($tune['tune_data'])
            ];

            $query = $pdo->prepare("INSERT INTO alarm_history(" . implode(', ',$fields) . ")
                        VALUES(" . implode(', ',$values) . ");");

            $query->execute($params);

            $pdo->commit();

        }
        catch(Exception $e) {
            $pdo->rollBack();
        }

        Utils::sendEmail($user['firstname'] . " " . $user['lastname'], $params);
    }

    public static function exists($userFbId)
    {
        if (empty($userFbId))
            return false;

        $sth = DB::instance()
            ->prepare("SELECT * FROM users WHERE fbid = :fbid");
        $sth->bindParam(':fbid', $userFbId);
        $sth->execute();
        return $sth->rowCount() !== 0;

    }

    public static function getById($userID)
    {
        $userID = Utils::formatIndex($userID);
        $sth = DB::instance()->prepare("SELECT * FROM users WHERE fbid = :fbid LIMIT 1");
        $sth->bindParam(':fbid',$userID);
        $sth->execute();
        $user = $sth->fetch(PDO::FETCH_ASSOC);
        if ($user === false || !isset($user['id']))
            throw new AppException('User doesnt exist');

        return new User($user['fbid']);
    }

    public static function saveFireAlarm($userID, $settings, $todos, $alarm, $tune) {
        $pdo =  DB::instance();

        $encodedSettings = json_encode($settings);
        $didWakeUp = $alarm['post_alarm']['did_wake_up'];
        $didWakeUp = in_array($didWakeUp,['true','1']) ? 1 : 0;

        $sth = $pdo->prepare("UPDATE users SET settings = :settings WHERE fbid = :fbid");
        $sth->bindParam(':fbid',$userID);
        $sth->bindParam(':settings',$encodedSettings);
        $sth->execute();

        // Alarm
        $alarmID = $alarm['pre_alarm']['alarm_id'];

        self::updateAlarm($userID, $alarmID, [
            'snoozes_used' => intval($alarm['post_alarm']['snoozes_used'])
        ]);
        if ($didWakeUp) {
            $updateArr['server_wake_up_time'] = [
                'format' => PDO::PARAM_STR,
                'data' => date("Y-m-d H:i:s")
            ];
        }
        $updateArr['did_wake_up'] = $didWakeUp;

        self::updateAlarm($userID, $alarmID, $updateArr);

        return true;
    }

    private static function updateAlarm($fbId, $alarmID, Array $values) {
        $pdoProps = [];
        $pdoValues = [];
        foreach($values as $key => $val) {
            array_push($pdoProps,$key . "= :" . $key);
            $pdoValues[$key] = $val;
        }

        $qString = "UPDATE alarm_history SET " . implode(' , ',$pdoProps) . " WHERE fbid = :fbid AND id = :alarmid;";
        $pdoHandler = DB::instance()->prepare($qString);


        foreach($pdoValues as $pKey => $pVal) {
            if (is_array($pVal))
                $pdoHandler->bindParam(':' . $pKey ,$pVal['data'], $pVal['format']); // In case we have to set up a format
            else
                $pdoHandler->bindParam(':' . $pKey ,$pVal);
        }

        $pdoHandler->bindParam(':fbid', $fbId);
        $pdoHandler->bindParam(':alarmid', $alarmID);



        $pdoHandler->execute();

        return true;
    }

    public static function saveStartAlarm($userID, $settings, $todos, $alarm, $tune)
    {
        $pdo =  DB::instance();

        self::updateTodos($userID, $todos);

        $encodedSettings = json_encode($settings);
        $sth = $pdo->prepare("UPDATE users SET settings = :settings WHERE fbid = :fbid");
        $sth->bindParam(':fbid', $userID);
        $sth->bindParam(':settings', $encodedSettings);
        $sth->execute();

        // Alarm
        $fields = ['fbid', 'settings', 'time_setted', 'alarm_time',
            'snooze_times', 'snooze_duration', 'did_wake_up', 'snoozes_used', 'tune_type', 'tune_data', 'server_time_setted'];

        $values = [];
        foreach($fields as $field) { array_push($values,":" . $field); }
        $params = [
            'fbid' => $userID,
            'settings' => json_encode($settings), // The REAL settings
            'time_setted' =>  $alarm['pre_alarm']['time_setted'], // YYYY-MM-DD HH:mm:ss
            'alarm_time' => $alarm['pre_alarm']['alarm_time'], // HH:mm:ss
            'snooze_times' => intval($settings['clock']['snooze_times']),
            'snooze_duration' => intval($settings['clock']['snooze_duration']),
            'did_wake_up' => $alarm['post_alarm']['did_wake_up'] === 'false' ? 0 : 1,
            'snoozes_used' => intval($alarm['post_alarm']['snoozes_used']),
            'tune_type' => $tune['tune_type'],
            'tune_data' => json_encode($tune['tune_data']),
            'server_time_setted' => date("Y-m-d H:i:s")
        ];

        $query = $pdo->prepare("INSERT INTO alarm_history(" . implode(', ',$fields) . ") VALUES(" . implode(', ',$values) . ");");
        $query->execute($params);

        return $pdo->lastInsertId();
    }

    public static function updateTodos($userID, $todos)
    {
        $sth = DB::instance()->prepare("DELETE FROM todos WHERE fbid = :fbid");
        $sth->bindParam(':fbid',$userID);
        $sth->execute();

        foreach($todos as $key => $todo) {
            $query = DB::instance()->prepare("INSERT INTO todos(fbid, priority, listindex, text, is_done) VALUES(:fbid, :priority, :index, :text, :is_done);");
            $query->execute([
                ':fbid' => $userID,
                ':priority' => intval($todo['priority']),
                ':index' => $key+1,
                ':text' => $todo['text'],
                ':is_done' => $todo['is_done'] === "0" || $todo['is_done'] === "false" ? 0 : 1,
            ]);
        }

    }

    public static function updateTune($userID, $tune, $alarmId)
    {
        $query = DB::instance()->prepare("UPDATE users SET tune_json_object = :tune_json_object WHERE fbid = :fbid AND id = :alarm_id;");
        $query->execute([
            ':fbid' => $userID,
            ':alarm_id' => $alarmId,
            ':tune_json_object' => json_encode([
                'tune_data' => $tune['tune_data'],
                'tune_type' => $tune['tune_type']
            ])
        ]);

    }

    /**
     * @return string|null
     */
    public static function refreshSessionsAndGetIndexIfPossible()
    {
        if (isset($_SESSION['user_access_token']) && $_SESSION['user_access_token'] !== null) {
            $accessToken = $_SESSION['user_access_token'];
            try {

                if (isset($_SESSION['user_id']) && $_SESSION['user_id'] !== null)
                    return $_SESSION['user_id'];

                $fb = MCFacebook::getFacebook();
                $me = $fb->get('/me?fields=id,first_name,last_name,email', $accessToken);
                $fbBody = $me->getDecodedBody();

                $_SESSION['user_id'] = $fbBody['id'];


                return $fbBody['id'];
//                $settings = User::getData($fbBody['id']);
            } catch (\Exception $e) {
                unset($_SESSION['user_access_token']);
                unset($_SESSION['user_id']);
                return null;
            }
        } else {
            unset($_SESSION['user_id']);
            return null;
        }
    }

    private static function getSessionUserId()
    {
        return $_SESSION['user_id'];
    }

    public static function getPeopleCount()
    {
//        $sth = DB::instance()->prepare("SELECT count(*) as counter FROM users");
//        $sth->bindParam(':fbid',$userID);
//        $sth->execute();
//        $counter = $sth->fetchAll(PDO::FETCH_ASSOC);
//        $counter = $counter[0]['counter'] + 342506;
//
//        return $counter;
    }

    public static function getAlarmHistory($fbId)
    {
        $sth = DB::instance()->prepare("SELECT distinct * FROM alarm_history as ah WHERE fbid = :fbid AND did_wake_up = 1 AND deleted_from_history != 1 ORDER BY server_time_setted DESC LIMIT 5");
        $sth->bindParam(':fbid',$fbId);
        $sth->execute();
        $ret = $sth->fetchAll(PDO::FETCH_ASSOC);
        return $ret;
    }

    private function getDetails() {
        if (0 === count($this->details))
            $this->fetch();

        return $this->details;
    }

    public function getFbID() {
        $details = $this->getDetails();
        return $details['fbid'];
    }

    public static function getJustWokeUpUsers($offset)
    {
        $query = "SELECT alarm_history.id as alarm_id, alarm_history.*, users.* FROM alarm_history INNER JOIN users on users.fbid = alarm_history.fbid WHERE alarm_history.did_wake_up = 1 order by alarm_history.server_wake_up_time DESC LIMIT 15 OFFSET :offset";
        $sth = DB::instance()->prepare($query);
        $sth->bindParam(':offset', $offset);
        $sth->execute();
        $ret = $sth->fetchAll(PDO::FETCH_ASSOC);

        $arr = [];
        $arr['server_time'] = date("Y-m-d H:i:s");
        $arr['items'] = $ret;
        return $arr;
    }

    public static function incrementSnooze($alarmID, $userID)
    {
        $query = "UPDATE alarm_history SET snoozes_used = snoozes_used + 1 WHERE id = :alarmid AND fbid = :userid";
        $sth = DB::instance()->prepare($query);
        $sth->bindParam(':alarmid',$alarmID);
        $sth->bindParam(':userid',$userID);
        $ret = $sth->execute();

        return $ret;

    }

    public function fetch() {
        if (0 === count($this->details))
        {
            $sth = DB::instance()->prepare("SELECT * FROM users WHERE fbid = :fbid LIMIT 1");
            $sth->bindParam(':fbid',$this->fbID);
            $sth->execute();
            $this->details = $sth->fetch(PDO::FETCH_ASSOC);
        }
        return $this;
    }

    public function setSetting($key,$value) {
        // todo
    }

    public static function deleteFromHistory($userID, $alarmId) {
        $sth = DB::instance()->prepare("UPDATE alarm_history SET deleted_from_history = 1 WHERE fbid = :fbid AND id = :alarmid");
        $sth->bindParam(':fbid',$userID);
        $sth->bindParam(':alarmid',$alarmId);
        $sth->execute();
        return true;
    }

    public static function getData($userID) {

        $sth = DB::instance()->prepare("SELECT * FROM users WHERE fbid = :fbid LIMIT 1");
        $sth->bindParam(':fbid',$userID);
        $sth->execute();
        $user = $sth->fetch(PDO::FETCH_ASSOC);

        if (array_key_exists('picture', $user) && $user['picture'] === null) {
            try {
                $accessToken = $_SESSION['user_access_token'];
                $fb = MCFacebook::getFacebook();
                $me = $fb->get('/me?fields=picture.type(large)', $accessToken);
                $body = $me->getDecodedBody();

                if (array_key_exists('picture', $body) && array_key_exists('data', $body['picture']) && array_key_exists('url', $body['picture']['data'])) {
                    $sth = DB::instance()->prepare("UPDATE users SET picture = :picture_url WHERE fbid = :fbid");
                    $sth->bindParam(':fbid',$userID);
                    $sth->bindParam(':picture_url',$body['picture']['data']['url']);
                    $sth->execute();
                }

                $user['picture'] = $body['picture']['data']['url'];
            } catch(Exception $e) {
                $user['picture'] = 'img/user.png';
            }


        }

        $sth = DB::instance()->prepare("SELECT * FROM todos WHERE fbid = :fbid LIMIT 20");
        $sth->bindParam(':fbid',$userID);
        $sth->execute();
        $todos = $sth->fetchAll(PDO::FETCH_ASSOC);

        $sth = DB::instance()->prepare("SELECT * FROM alarm_history WHERE fbid = :fbid ORDER BY server_time_setted DESC LIMIT 1");
        $sth->bindParam(':fbid',$userID);
        $sth->execute();
        $alarm = $sth->fetch(PDO::FETCH_ASSOC);

        $sth = DB::instance()->prepare("SELECT distinct * FROM alarm_history as ah WHERE fbid = :fbid AND did_wake_up = 1 AND deleted_from_history != 1 ORDER BY server_time_setted DESC LIMIT 5");
        $sth->bindParam(':fbid',$userID);
        $sth->execute();
        $alarmsHistory = $sth->fetchAll(PDO::FETCH_ASSOC);

        $alarmArr = [];
        $tuneArr = [];
        if ($alarm !== false && is_array($alarm) && count($alarm) > 0) {
            $alarmArr = [
                'pre_alarm' => [
                    'settings' => json_decode($alarm['settings']),
                    'time_setted' => null,
                    'alarm_id' => json_decode($alarm['id']),
                    'alarm_time' => $alarm['alarm_time'],
                ],
                'post_alarm' => [
                    'did_wake_up' => $alarm['did_wake_up'],
                    'snoozes_used' => $alarm['snoozes_used']
                ],
                'alarm_history' => $alarmsHistory
            ];
            $tuneArr = [
                'tune_type' => $alarm['tune_type'],
                'tune_data' => json_decode($alarm['tune_data'])
            ];
        }

        return [
            'user' => [
                'is_logged_in' => true,
                'fbid' => $user['fbid'],
                'firstname' => $user['firstname'],
                'lastname' => $user['lastname'],
                'email' => $user['email'],
                'picture' => $user['picture']
            ],
            'todos' => $todos,
            'alarm' => $alarmArr,
            'tune' => $tuneArr,
            'settings' => json_decode($user['settings'])
        ];

    }
}