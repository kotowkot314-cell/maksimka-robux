<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Xliilx — Вход</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: 'Segoe UI', sans-serif;
      background: radial-gradient(circle at 50% 0%, #2a1a1a, #0a0a0a 70%);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .box {
      background: #1a1a1a;
      padding: 40px;
      border-radius: 16px;
      width: 340px;
      box-shadow: 0 0 40px rgba(230, 57, 70, 0.2);
      border: 1px solid #2a2a2a;
    }
    h1 {
      text-align: center;
      color: #e63946;
      font-size: 32px;
      letter-spacing: 4px;
      margin: 0 0 24px;
      text-shadow: 0 0 20px rgba(230, 57, 70, 0.5);
    }
    input {
      width: 100%;
      padding: 12px;
      margin: 8px 0;
      background: #0f0f0f;
      border: 1px solid #333;
      color: #fff;
      border-radius: 8px;
      font-size: 14px;
    }
    input:focus {
      outline: none;
      border-color: #e63946;
    }
    button {
      width: 100%;
      padding: 14px;
      background: #e63946;
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
      font-size: 14px;
      letter-spacing: 1px;
      transition: 0.2s;
    }
    button:hover { background: #f04f5c; }
    .btn-alt {
      background: #333;
      margin-top: 8px;
    }
    .btn-alt:hover { background: #444; }
    .err {
      color: #e63946;
      font-size: 13px;
      min-height: 20px;
      text-align: center;
      margin: 8px 0;
    }
    .footer {
      text-align: center;
      color: #555;
      font-size: 11px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="box">
    <h1>XLIILX</h1>
    <input id="user" placeholder="Никнейм" autocomplete="username">
    <input id="pass" type="password" placeholder="Пароль" autocomplete="current-password">
    <div class="err" id="err"></div>
    <button onclick="register()">Регистрация</button>
    <button class="btn-alt" onclick="login()">Войти</button>
    <div class="footer">Xliilx v1.0 © 2026</div>
  </div>

  <script>
    async function send(path) {
      const username = document.getElementById('user').value.trim();
      const password = document.getElementById('pass').value;
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.error) return showErr(data.error);
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      location.href = '/game.html';
    }
    function register() { send('/api/register'); }
    function login() { send('/api/login'); }
    function showErr(msg) { document.getElementById('err').textContent = msg; }
  </script>
</body>
</html>