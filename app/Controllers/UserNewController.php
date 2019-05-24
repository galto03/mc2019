<?php
namespace App\Controller;

use App\Models\UserNew;
use Exception;
use MartynBiz\Slim3Controller\Controller;

class UserNewController extends Controller
{

    public function loginUser() {
        $params = $this->request->getParsedBody();
        $id = $params['fb_id'];
        $firstName = $params['first_name'];
        $lastName = $params['last_name'];
        $email = $params['email'];
        $configuration = $params['configuration'];
        $results = null;

        try {
            if (empty(UserNew::getUser($id))) {
                // User does not exist, create it with current configuration
                 UserNew::createNew($id, $firstName, $lastName, $email, $configuration);
            }
        } catch (Exception $e) {
            // todo
        }

        return $this->response->withJson([
          'AppSettings' => $configuration,
          'first_name' => $firstName,
          'last_name' => $lastName,
          'email' => $email,
          'id' => $id
        ]);
    }

    /**
     * @return mixed
     */
    public function saveConfiguration() {
        $params = $this->request->getParsedBody();
        $configuration = $params['configuration'];
        $fbId = $params['fb_id'];
        $fb = UtilsNew::getFacebook();
        if (!$fb) {
            return $this->response->withJson([
              'error' => 'Not logged in'
            ], 500);
        }

        $confSaved = UserNew::saveConfiguration($fbId, $configuration);
        if (!$confSaved) {
            return $this->response->withJson([
              'error' => 'Could not save configuration'
            ], 500);
        }
        return $this->response->withJson([
          'success' => true
        ]);

    }




}