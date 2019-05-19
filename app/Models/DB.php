<?php
/**
 * Created by PhpStorm.
 * User: Tomer
 * Date: 27/03/17
 * Time: 18:35
 */

namespace App\Models;


use Interop\Container\ContainerInterface;
use PDO;

class DB
{

    const HOST       = 'localhost';
    const DBNAME     = 'metacloc_MetaClock';//'metacloc_MetaClock';
    const USER       = 'root';
    const PASS       = 'root';
    const CHARSET    = 'utf8';

    protected static $instance = null;
    protected static $container = null;

    protected function __construct() {}

    public static function init($container)
    {
    }

    protected function __clone() { return false; }

    public static function instance()
    {
		    // TODO - Temporarily removed this
//		try {
//			if (self::$instance === null)
//			{
//				$opt  = array(
//					PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
//					PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
//					PDO::ATTR_EMULATE_PREPARES   => FALSE
//				);
//				$dsn = "mysql:host=" . self::HOST . ";dbname=" . self::DBNAME . ";charset=" . self::CHARSET;
//				self::$instance = new PDO($dsn, self::USER, self::PASS, $opt);
//
			//	self::$instance->prepare("SET SESSION interactive_timeout = 28800;");
			//	self::$instance->execute(); 
			//	self::$instance->prepare("SET SESSION wait_timeout = 28800;");
			//	self::$instance->execute();
//			}
//			return self::$instance;
//		} catch(PDOException $e) {
//			throw new Exception($e->getCode());
//		}

    }

//    public static function __callStatic($method, $args)
//    {
//        return call_user_func_array(array(self::instance(), $method), $args);
//    }
//
//    public static function run($sql, $args = [])
//    {
//        $stmt = self::instance()->prepare($sql);
//        $stmt->execute($args);
//        return $stmt;
//    }
//
//	public function __destruct() {
//		unset(self::$instance);
//	}
//
//    public function __wakeup() {
//        return false;
//	}

}