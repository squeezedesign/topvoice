<?php
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$nombre  = trim($_POST['nombre']  ?? '');
$email   = trim($_POST['email']   ?? '');
$mensaje = trim($_POST['mensaje'] ?? '');

if (!$nombre || !$email || !$mensaje) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Faltan campos']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Email no válido']);
    exit;
}

require_once __DIR__ . '/smtp_config.php';
require_once __DIR__ . '/lib/phpmailer/Exception.php';
require_once __DIR__ . '/lib/phpmailer/PHPMailer.php';
require_once __DIR__ . '/lib/phpmailer/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = SMTP_USER;
    $mail->Password   = SMTP_PASSWORD;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = 587;
    $mail->CharSet    = 'UTF-8';

    $mail->setFrom(SMTP_FROM, 'Top Voice Web');
    $mail->addAddress(MAIL_TO);
    $mail->addReplyTo($email, htmlspecialchars($nombre, ENT_QUOTES, 'UTF-8'));

    $mail->Subject = 'Contacto web · ' . htmlspecialchars($nombre, ENT_QUOTES, 'UTF-8');
    $mail->Body    = "Nombre: $nombre\nEmail: $email\n\nMensaje:\n$mensaje";

    $mail->send();
    echo json_encode(['ok' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $mail->ErrorInfo]);
}