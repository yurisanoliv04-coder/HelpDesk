@echo off
title HelpDesk — Parando servicos...
color 0C

set "ROOT=%~dp0"
set "COMPOSE_FILE=%ROOT%docker-compose.yml"

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║        H E L P D E S K  —  Parando sistema          ║
echo  ╚══════════════════════════════════════════════════════╝
echo.

:: ── Para o Next.js (mata processos node na porta 3000) ───────────────────────
echo  [1/2] Parando servidor Next.js (porta 3000)...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3000 "') do (
    taskkill /PID %%a /F >nul 2>&1
)
echo        OK.

:: ── Para o container Docker ───────────────────────────────────────────────────
echo.
echo  [2/2] Parando container PostgreSQL...
docker compose -f "%COMPOSE_FILE%" stop >nul 2>&1
if errorlevel 1 (
    echo        Docker nao encontrado ou container ja parado.
) else (
    echo        OK — Container parado (dados preservados).
)

echo.
echo  Sistema encerrado. Os dados do banco foram preservados.
echo.
pause
