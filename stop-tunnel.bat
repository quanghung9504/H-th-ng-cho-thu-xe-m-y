@echo off
echo Dang tim va dung LocalTunnel dang chay ngam...
wmic process where "commandline like '%%localtunnel%%'" delete
echo Da dung tat ca cac tien trinh LocalTunnel.
pause
