<?php

// File: metrics.php
$allowedOrigin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
header('Access-Control-Allow-Origin: ' . $allowedOrigin);
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// File: metrics.php
function getCountryFromIP($ip) {
    $url = "http://ip-api.com/json/{$ip}";
    $response = file_get_contents($url);
    $data = json_decode($response, true);
    return $data['country'] ?? 'Unknown';
}

// Check if the request is a POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
	
	
    // Get client IP address
    $clientIP = $_SERVER['REMOTE_ADDR'];
    // Get country from IP
    $country = getCountryFromIP($clientIP);
	
    // Limit request size, for example, 1KB
    if (strlen(file_get_contents('php://input')) > 1024) {
        http_response_code(413); // Payload Too Large
        exit;
    }

    $content = file_get_contents('php://input');
    $decoded = json_decode($content, true);

    if (is_array($decoded) &&
        isset($decoded['metricName'], $decoded['metricValue']) &&
        is_string($decoded['metricName']) &&
        is_string($decoded['metricValue'])) {
        
        // Sanitize the input
        $metricName = htmlspecialchars($decoded['metricName']);
        $metricValue = htmlspecialchars($decoded['metricValue']);

        // Log entry
        $logEntry = date('Y-m-d H:i:s') . " -IP: {$clientIP}, Country: {$country}, Metric: {$metricName}, Value: {$metricValue}\n";
    file_put_contents('metrics.log', $logEntry, FILE_APPEND);

        echo json_encode(['status' => 'success']);
    } else {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid data format']);
    }
} else {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
}
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Just exit with 200 OK if the request method is OPTIONS
    http_response_code(200);
    exit(0);
}
?>
