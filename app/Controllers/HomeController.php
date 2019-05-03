<?php
namespace App\Controller;
use App\Models\AppException;
use App\Models\DB;
use App\Models\MCFacebook;
use App\Models\User;
use MartynBiz\Slim3Controller\Controller;
use PDO;
use Psr\Http\Message\RequestInterface;
use Psr\Http\Message\ResponseInterface;
/**
 * Created by PhpStorm.
 * User: Tomer
 * Date: 27/03/17
 * Time: 15:50
 */
class HomeController extends Controller
{

    public function beforeDispatch() {
		// Attention: 6/10 I did some commenting here, not sure about the first method, pretty sure the $settings is unnecessary though because everything comes though ajax anyways
       // $fbId = User::refreshSessionsAndGetIndexIfPossible();

       // $settings = ($fbId === null) ? [] : User::getData($fbId);

       require_once __DIR__ . '/Mobile_Detect.php';
       $detect = new Mobile_Detect();
       if ($detect->isMobile()) {
        return $this->render('index.mobile.phtml');
        } else {
            return $this->render('index.min.before.phtml',[
                'userData' => [],
                'initValues' => [
                    'people_count' => User::getPeopleCount()
                ]
            ]);
        }


    }

    public function dispatch() {
        require_once __DIR__ . '/Mobile_Detect.php';
        $detect = new Mobile_Detect();
        if ($detect->isMobile()) {
            return $this->render('index.mobile.phtml');
        } else {
            return $this->render('index.phtml',[
                'userData' => [],
                'initValues' => [
                    'people_count' => User::getPeopleCount()
                ]
            ]);
        }
    }

    public function oldMetaClock() {
        require __DIR__ . '/../../old/public_html/index.php';


        $this->render();
    }

    public function oldMetaClockAjax() {
//        require '/../../old/public_html/application/models/MetaClockAjax.php';
        define('__DEBUG_MODE', true);


        /** Basic constants and functions */
        require_once(__DIR__ . '/../../old/application/data/functions.php');
        require_once(__DIR__ . '/../../old/application/data/constants.php');
        require_once(__DIR__ . '/../../old/application/Router.php');
        require_once(__DIR__ . '/../../old/application/Controller.php');
        require_once(__DIR__ . '/../../old/application/Model.php');
        require_once(__DIR__ . '/../../old/application/FrontEndModel.php');
        require_once(__DIR__ . '/../../old/application/Datamodel.php');

        /** Libraries */
        require_once (__DIR__ . '/../../old/application/libs/facebook/base_facebook.php');
        require_once (__DIR__ . '/../../old/application/libs/facebook/facebook.php');

        $route = $this->request->getParsedBody();
        $params = [];
//        require __DIR__ . '/../../old/application/ajaxrouter.php';





        $d = 1;
    }

    public function logError() {
        require  __DIR__ . '/../vendor/phpmailer/phpmailer/PHPMailerAutoload.php';

        $data = $this->request->getParsedBody()['params'];

        $message = $data[0];
        $stack = $data[1];
        $mail = new \PHPMailer();

        $mail->setFrom('admin@metaclock.com', 'MetaClock.com');
        $mail->addAddress('galtom007@gmail.com');
        $mail->addReplyTo('no-reply@metaclock.com', 'MetaClock.com');

        $mail->Subject = 'Fatal exception in MetaClock';
        $mail->Body    = "The following fatal exception was thrown in the app: \n\nMessage:\n" . $message . "\n\nStack:\n" . $stack;

        if(!$mail->send()) {
            $this->app->flash("error", "We're having trouble with our mail servers at the moment.  Please try again later, or contact us directly by phone.");
            error_log('Mailer Error: ' . $mail->errorMessage());
            $this->app->halt(500);

            return $this->response->withJson($mail->errorMessage());
        }

        return $this->response->withJson([
            'message' => $message,
            'stack' => $stack
        ]);
    }

    public function removeRecentAlarms() {
        $preData = $this->request->getQueryParams();
        $alarmID = intval($preData['alarm_id']);
        $userID = $preData['user_id'];
        $data = User::deleteFromHistory($userID, $alarmID);
        return $this->response->withJson($data);
    }

    public function getJustWokeUp() {
        $preData = $this->request->getQueryParams();
        $offset = intval($preData['offset']);
//        $userID = $preData['user']['fbid'];
//        if (User::exists($userID)) {
//            User::saveFireAlarm($userID, $preData['settings'], $preData['todo'], $preData['alarms'], $preData['tune']);
//        }

        $data = User::getJustWokeUpUsers($offset);
        return $this->response->withJson($data);
    }

    public function getRandomQuote() {
        $pdo = DB::instance();
        $query = "SELECT * FROM quotes q WHERE q.length <= 110 order by rand() limit 1;";
        $sth = $pdo->prepare($query);
        $sth->execute();
        $quote = $sth->fetch(PDO::FETCH_ASSOC);
        unset($quote['id']);
        unset($quote['length']);
        return $this->response->withJson($quote);
    }

    public function getQuotes() {
        $i = 1;
        while (--$i !== 0) {
            $quotes = simplexml_load_file('http://api.forismatic.com/api/1.0/?method=getQuote&lang=en');
            $text = (string)$quotes->quote->quoteText;
            $author = (string)$quotes->quote->quoteAuthor;

            if (trim($text) === '')
                continue;
            if (trim($author) === '')
                $author = 'Unknown';

            try {
                $pdo = DB::instance();
                $query = "INSERT INTO quotes(text, author, length) VALUES(:text, :author, :length);";
                $queryObj = $pdo->prepare($query);
                $queryObj->execute([
                    ':text' =>  $text,
                    ':author' => $author,
                    ':length' => strlen($text),
                ]);
            } catch(\Exception $e) {
                $dbg = 'not unique?';
            }

        }

    }
}