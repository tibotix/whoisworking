<?php

$INACTIVE_TIMEOUT = 600;

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    die();
}

$fp = fopen("./data.json", "r");
if (!$fp){
    die("Could not open file");
}
$data = null;
if ($lock = flock($fp, LOCK_SH)) {
    fseek($fp, 0, SEEK_END);
    $filesize = ftell($fp);
    rewind($fp);
    if ($filesize > 0) {
        $data = json_decode(fread($fp, $filesize));
    } else {
        $data = new stdClass();
    }
}
fclose($fp);

if ($data === null){
    die("Could not read file");
}
?>

<!DOCTYPE html>
<html>
<head>
  <title>Activity Overview:</title>
  <style>
    p {
        font-size: 1.5rem;
        display: inline;
    }

    .detail {
        font-size: 1rem
    }

    .header {
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
    }

    .active {
        color: green;
    }

    .break {
        color: blue;
    }

    .inactive {
        color: red;
    }
  </style>
</head>

<body>
<div class="header">
<h1>Activity Overview</h1>
</div>

<div>
<?php
    foreach ($data as $key => $value) {
        $last_activity_action = $value->last_activity_action;
        echo "<p>" . htmlentities($key) . ": </p>";
        if (time() <= $value->break_time) {
            echo "<p class=\"break\">active | break</p>";
        } else if (time() - $last_activity_action >= $INACTIVE_TIMEOUT) {
            echo "<p class=\"inactive\">inactive</p>";
        } else {
            echo "<p class=\"active\">active</p>";
        }
        echo "<p class=\"detail\">\t(Last Activity Action at </p>";
        echo "<p class=\"detail\">" . date("d.m.Y H:i:s", $last_activity_action) . ")</p>";
        if (property_exists($value, "message")){
            echo "<p class=\"detail\">\tMessage: " . htmlentities($value->message) . "</p>";
        }
        echo "<br>";
    }
?>
</div>
</body>
</html>
