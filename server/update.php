<?php

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    die();
}

// Copied from StackOverflow: https://stackoverflow.com/questions/40582161/how-to-properly-use-bearer-tokens
function getAuthorizationHeader(){
    $headers = null;
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER["Authorization"]);
    }
    else if (isset($_SERVER['HTTP_AUTHORIZATION'])) { //Nginx or fast CGI
        $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        // Server-side fix for bug in old Android versions (a nice side-effect of this fix means we don't care about capitalization for Authorization)
        $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }
    return $headers;
}

function getBasicToken() {
    $headers = getAuthorizationHeader();
    if (!empty($headers)) {
        if (preg_match('/Basic\s(\S+)/', $headers, $matches)) {
            return $matches[1];
        }
    }
    return null;
}

$_POST = json_decode(file_get_contents("php://input"), true);
if (!isset($_POST["status"])) {
    die();
}

if (($basic = getBasicToken()) === null) {
    die("No basic token");
}
$basic = base64_decode($basic, true);
if ($basic === false) {
    die();
}
list($user, $pass) = explode(":", $basic);

$fp = fopen("./data.json", "c+");
if ($lock = flock($fp, LOCK_EX)) {
    fseek($fp, 0, SEEK_END);
    $filesize = ftell($fp);
    rewind($fp);
    $data = null;
    if ($filesize > 0) {
        $data = json_decode(fread($fp, $filesize), true);
    } else {
        $data = array();
    }
    if ($data !== null){
        $data[$user] = $_POST["status"];
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($data));
    }
}
fclose($fp);


?>