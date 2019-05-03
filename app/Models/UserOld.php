<?php
//
//namespace App;
//
//use Interop\Container\ContainerInterface;
//use PDO;
//use RKA\Session;
//use Slim\Http\Request;
//use Slim\Http\Response;
//
//class User extends Model {
//    private $fbID;
//
//    public static function getCurrent() {
//
//    }
//
//    static function isLoggedIn() {
//        return MCFacebook::isLoggedIn();
//    }
//
//    public function getLoggedInUserDetails($fbID)
//    {
//        return [
//            'user' =>   $this->_getUser($fbID),
//            'todos'=>   $this->_getUserTodos($fbID),
//            'alarms'=>  $this->_getUserAlarms($fbID)
//        ];
//    }
//
//    public function __invoke(Request $request, Response $response, $args = []) {
////        return $response->write("Hello Wor3ld");
//    }
//
//    static public function create($fbID,$firstName,$lastName,$email,$preSettings) {
//
//    }
//
//    /**
//     * Login or register (create)
//     * @param Request $request
//     * @param Response $response
//     * @param array $args
//     * @return array
//     */
//    public function connect(Request $request, Response $response, $args = []) {
//        $params = $request->getParsedBody()['params'];
//        $fbID = $params['fbID'];
//        $firstName = $params['firstName'];
//        $lastName = $params['lastName'];
//        $email = $params['email'];
//        $additionalSettings = $params['additionalSettings'];
//        $user = $this->_getUser($fbID);
//        if (!$user) {
//            // Not exist, therefore create it
//            $user = $this->_createUser($fbID,$firstName,$lastName, $email, $additionalSettings);
//        }
//
//        return self::getLoggedInUserDetails($user->fbid);
//    }
//
//    private function _getUser($fbID)
//    {
//        $sth = $this->ci['db']->prepare("SELECT * FROM users WHERE fbid = ?");
//        $sth->bindParam(1,$fbID);
//        $sth->execute();
//        return $sth->fetch(PDO::FETCH_OBJ);
//    }
//
//    private function _createUser($fbID, $firstName, $lastName, $email, $additionalSettings = [])
//    {
//        $db = $this->ci['db'];
//        $defaultSettings = json_encode([
//            'background'    => 'yey'
//        ]);
//
//        // Todo: remove this, it should come from the app anyway
//        $defaultTodos = json_encode([
//            [
//                'title'     =>    'Eat some breakfast',
//                'priority'  =>    0,
//                'done'      =>    false,
//                'index'     =>    1
//            ],
//            [
//                'title'     =>    'Take over the world',
//                'priority'  =>    0,
//                'done'      =>    true,
//                'index'     =>    2
//            ],
//            [
//                'title'     =>    'This to-do must be important',
//                'priority'  =>    1,
//                'done'      =>    false,
//                'index'     =>    3
//            ]
//        ]);
//        $sth = $db->prepare("INSERT INTO users(firstname, lastname, email, settings, fbid) VALUES(?, ?, ?, ?, ?)");
//        $sth->bindParam(1,$firstName);
//        $sth->bindParam(2,$lastName);
//        $sth->bindParam(3,$email);
//        $sth->bindParam(4,$defaultSettings);
//        $sth->bindParam(5,$fbID);
//        $sth->execute();
//
//        foreach($defaultTodos as $todo)
//        {
//            $sth = $db->prepare("INSERT INTO todos(fbid,priority,index,text,is-done) VALUES(?, ?, ?, ?, ?)");
//            $sth->bindParam(1,$fbID);
//            $sth->bindParam(2,$todo['priority']);
//            $sth->bindParam(3,$todo['index']);
//            $sth->bindParam(4,$todo['text']);
//            $sth->bindParam(5,$todo['is-done']);
//            $sth->execute();
//        }
//
//        return self::_getUser($fbID);
//
//    }
//
//    private function _getUserTodos($fbID)
//    {
//        $sth = $this->ci['db']->prepare("SELECT * FROM todos WHERE fbid = ?");
//        $sth->bindParam(1,$fbID);
//        $sth->execute();
//        return $sth->fetch(PDO::FETCH_OBJ);
//    }
//
//    private function _getUserAlarms($fbID)
//    {
//        $sth = $this->ci['db']->prepare("SELECT * FROM alarms WHERE fbid = ?");
//        $sth->bindParam(1,$fbID);
//        $sth->execute();
//        return $sth->fetch(PDO::FETCH_OBJ);
//    }
//}