<?php
declare(strict_types=1);

header('X-Robots-Tag: noindex, nofollow', true);
header('Cache-Control: no-store, max-age=0', true);
header('Content-Type: text/plain; charset=UTF-8', true);

const FORM_RECIPIENT = 'info@trustedfor.ai';
const FORM_FROM = 'info@trustedfor.ai';

function limit_text(string $value, int $max): string
{
    return function_exists('mb_substr')
        ? mb_substr($value, 0, $max, 'UTF-8')
        : substr($value, 0, $max);
}

function finish(string $kind, string $status): void
{
    $page = $kind === 'join' ? 'join.html' : 'contact.html';
    header('Location: ' . $page . '?form=' . rawurlencode($status) . '#form-status', true, 303);
    exit;
}

function one_line(string $key, int $max = 300): string
{
    $value = $_POST[$key] ?? '';
    if (is_array($value)) {
        return '';
    }
    $value = trim((string) $value);
    $value = preg_replace('/[\r\n\x00]+/u', ' ', $value) ?? '';
    return limit_text($value, $max);
}

function multi_line(string $key, int $max = 5000): string
{
    $value = $_POST[$key] ?? '';
    if (is_array($value)) {
        return '';
    }
    $value = str_replace("\0", '', trim((string) $value));
    return limit_text($value, $max);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo 'Method Not Allowed';
    exit;
}

$kind = one_line('form_kind', 20);
if (!in_array($kind, ['contact', 'join'], true)) {
    finish('contact', 'error');
}

// Honeypot: bots often fill this visually hidden field.
if (one_line('website', 200) !== '') {
    finish($kind, 'sent');
}

$started = (int) one_line('form_started', 20);
if ($started > 0 && (int) floor(microtime(true) * 1000) - $started < 1500) {
    finish($kind, 'error');
}

$name = one_line('name', 120);
$email = one_line('email', 254);
$org = one_line('org', 200);
$dept = one_line('dept', 200);
$type = one_line('type', 100);
$message = multi_line('message');
$agreed = isset($_POST['privacy']);

if ($name === '' || !$agreed || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    finish($kind, 'error');
}
if ($kind === 'join' && ($org === '' || $type === '')) {
    finish($kind, 'error');
}
if ($kind === 'contact' && ($type === '' || $message === '')) {
    finish($kind, 'error');
}

$membershipLabels = [
    'member' => '会員として参加する',
    'core' => 'コアメンバーとして参画したい',
    'ask' => 'まずは話を聞きたい',
];
$themeLabels = [
    'spec' => '仕様の策定',
    'tech' => '技術要件（カタログ・MCP・認証）',
    'usecase' => 'ユースケース',
    'business' => 'ビジネスモデル',
    'data' => 'データ・AI連携',
];

$themes = [];
$postedThemes = $_POST['theme'] ?? [];
if (!is_array($postedThemes)) {
    $postedThemes = [$postedThemes];
}
foreach ($postedThemes as $postedTheme) {
    $key = preg_replace('/[^a-z]/', '', (string) $postedTheme) ?? '';
    if (isset($themeLabels[$key])) {
        $themes[] = $themeLabels[$key];
    }
}

$subject = $kind === 'join'
    ? '【公共AIナレッジ研究会】入会申込フォーム'
    : '【公共AIナレッジ研究会】お問い合わせフォーム：' . $type;

$lines = [
    '公共AIナレッジ研究会Webサイトから送信されました。',
    '',
    '種別：' . ($kind === 'join' ? '入会申込' : 'お問い合わせ'),
    'お名前：' . $name,
    'メールアドレス：' . $email,
    '団体・法人名：' . ($org !== '' ? $org : '未入力'),
];

if ($kind === 'join') {
    $lines[] = '部署名：' . ($dept !== '' ? $dept : '未入力');
    $lines[] = '参加区分：' . ($membershipLabels[$type] ?? $type);
    $lines[] = '関心テーマ：' . ($themes ? implode('、', array_unique($themes)) : '未選択');
    $lines[] = 'ご質問・ご要望：';
    $lines[] = $message !== '' ? $message : '未入力';
} else {
    $lines[] = 'お問い合わせ種別：' . $type;
    $lines[] = 'お問い合わせ内容：';
    $lines[] = $message;
}

$body = implode("\n", $lines);
$fromName = function_exists('mb_encode_mimeheader')
    ? mb_encode_mimeheader('公共AIナレッジ研究会 Webフォーム', 'UTF-8')
    : 'Public AI Knowledge Consortium';
$headers = implode("\r\n", [
    'From: ' . $fromName . ' <' . FORM_FROM . '>',
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
]);

$sent = false;
if (function_exists('mb_language')) {
    mb_language('Japanese');
}
if (function_exists('mb_internal_encoding')) {
    mb_internal_encoding('UTF-8');
}
if (function_exists('mb_send_mail')) {
    $sent = mb_send_mail(FORM_RECIPIENT, $subject, $body, $headers);
} elseif (function_exists('mail')) {
    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    $sent = mail(FORM_RECIPIENT, $encodedSubject, $body, $headers);
}

finish($kind, $sent ? 'sent' : 'error');
