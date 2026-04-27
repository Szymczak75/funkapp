@echo off
D:
cd "%~dp0"
git pull
git add .
git commit -m "Aktualisierung"
git push
pause