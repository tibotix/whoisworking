<?php

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
        font-size: 2rem;
        display: inline;
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
        echo "<p>" . $key . ": </p>";
        if ($value === "active") {
            echo "<p class=\"active\">" . $value . "</p>";
        } else {
            echo "<p class=\"inactive\">" . $value . "</p>";
        }
    }
?>
</div>
</body>
</html>