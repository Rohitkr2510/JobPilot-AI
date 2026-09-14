@echo off
title JobPilot AI (Local)
echo Starting JobPilot AI server...
cd /d "%~dp0"
call npm run dev
pause
