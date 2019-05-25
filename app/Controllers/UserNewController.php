<?php
namespace App\Controller;

use App\Models\UserNew;
use App\Models\UtilsNew;
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
        $settings = array_key_exists('settings', $params) ? $params['settings'] : [];
        $results = null;

        try {
            if (empty(UserNew::getUser($id))) {
                // User does not exist, create it with current settings
                 UserNew::createNew($id, $firstName, $lastName, $email, $settings);
            }
        } catch (Exception $e) {
            // todo
        }

        return $this->response->withJson([
          'settings' => $settings,
          'first_name' => $firstName,
          'last_name' => $lastName,
          'email' => $email,
          'id' => $id
        ]);
    }

    /**
     * @return mixed
     */
    public function saveSettings() {
        $params = $this->request->getParsedBody();
        $settings = $params['settings'];
        $fbId = $params['fb_id'];
        $fb = UtilsNew::getFacebook();
        if (!$fb) {
            return $this->response->withJson([
              'error' => 'Not logged in'
            ], 500);
        }

        $confSaved = UserNew::saveSettings($fbId, $settings);
        if (!$confSaved) {
            return $this->response->withJson([
              'error' => 'Could not save settings'
            ], 500);
        }
        return $this->response->withJson([
          'success' => true
        ]);

    }




}