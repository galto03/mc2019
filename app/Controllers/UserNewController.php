<?php
namespace App\Controller;

use App\Models\UserNew;
use Exception;
use MartynBiz\Slim3Controller\Controller;

class UserNewController extends Controller
{

    public function getUser() {
        $params = $this->request->getParsedBody();
        $id = $params['fb_id'];
        $firstName = $params['first_name'];
        $lastName = $params['last_name'];
        $email = $params['email'];
        $configuration = $params['configuration'];
        $results = null;

        try {
            $userDetails = UserNew::getUser($id);

            if (empty($userDetails)) {
                // User does not exist, create it with current configuration
                 UserNew::createNew($id, $firstName, $lastName, $email, $configuration);
            }
        } catch (Exception $e) {
            // todo
        }

        return $this->response->withJson([
          'configuration' => $configuration,
          'first_name' => $firstName,
          'last_name' => $lastName,
          'email' => $email,
          'id' => $id
        ]);
    }





}