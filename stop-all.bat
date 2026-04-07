@echo off
echo Dang dung toan bo he thong chay ngam...

:: Dung LocalTunnel
wmic process where "commandline like '%%localtunnel%%'" delete

:: Dung Frontend (Vite)
wmic process where "commandline like '%%vite%%'" delete

:: Dung Backend (Nodemon / Node server.js)
wmic process where "commandline like '%%nodemon%%'" delete
wmic process where "commandline like '%%server.js%%'" delete

echo Da dung tat ca cac tien trinh (Backend, Frontend, Tunnel).
pause
