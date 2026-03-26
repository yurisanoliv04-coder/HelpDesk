@echo off
setlocal enabledelayedexpansion
title HelpDesk — Inicializando...
color 0A

:: ─────────────────────────────────────────────────────────────────────────────
::  HelpDesk · Script de inicialização
::  Autor: gerado automaticamente
:: ─────────────────────────────────────────────────────────────────────────────

set "ROOT=%~dp0"
set "PORT=3000"
set "COMPOSE_FILE=%ROOT%docker-compose.yml"
set "LOG_FILE=%ROOT%.helpdesk-start.log"
set "MAX_WAIT=30"

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║           H E L P D E S K  —  Sistema               ║
echo  ╚══════════════════════════════════════════════════════╝
echo.

:: ── 1. Verifica Docker ───────────────────────────────────────────────────────
echo  [1/5] Verificando Docker...
docker info >nul 2>&1
if errorlevel 1 (
    echo.
    echo  [ERRO] Docker nao esta em execucao.
    echo         Inicie o Docker Desktop e tente novamente.
    echo.
    pause
    exit /b 1
)
echo        OK — Docker detectado.

:: ── 2. Sobe o Postgres ───────────────────────────────────────────────────────
echo.
echo  [2/5] Iniciando banco de dados PostgreSQL...

:: Verifica se o container ja esta rodando
docker ps --filter "name=helpdesk_postgres" --filter "status=running" --format "{{.Names}}" | findstr /i "helpdesk_postgres" >nul 2>&1
if not errorlevel 1 (
    echo        OK — Container ja esta em execucao.
    goto :check_db_health
)

:: Sobe via docker compose
docker compose -f "%COMPOSE_FILE%" up -d >"%LOG_FILE%" 2>&1
if errorlevel 1 (
    echo.
    echo  [ERRO] Falha ao iniciar o container. Veja: %LOG_FILE%
    echo.
    type "%LOG_FILE%"
    echo.
    pause
    exit /b 1
)
echo        Container iniciado.

:check_db_health
:: Aguarda o Postgres aceitar conexoes
echo        Aguardando Postgres ficar pronto...
set "waited=0"
:wait_loop
    docker exec helpdesk_postgres pg_isready -U helpdesk -d helpdesk_db >nul 2>&1
    if not errorlevel 1 goto :db_ready
    set /a waited+=1
    if !waited! geq %MAX_WAIT% (
        echo.
        echo  [ERRO] Postgres nao ficou pronto em %MAX_WAIT% segundos.
        pause
        exit /b 1
    )
    <nul set /p "=."
    timeout /t 1 /nobreak >nul
    goto :wait_loop

:db_ready
echo.
echo        OK — Postgres pronto.

:: ── 3. Instala dependencias se necessario ────────────────────────────────────
echo.
echo  [3/5] Verificando dependencias npm...
if not exist "%ROOT%node_modules" (
    echo        node_modules ausente — rodando npm install...
    cd /d "%ROOT%"
    call npm install --silent
    if errorlevel 1 (
        echo  [ERRO] npm install falhou.
        pause
        exit /b 1
    )
    echo        OK — dependencias instaladas.
) else (
    echo        OK — node_modules presente.
)

:: ── 4. Executa migrations pendentes ──────────────────────────────────────────
echo.
echo  [4/5] Aplicando migrations do Prisma...
cd /d "%ROOT%"
call npx prisma migrate deploy >> "%LOG_FILE%" 2>&1
if errorlevel 1 (
    echo  [AVISO] migrate deploy retornou erro — verifique %LOG_FILE%
    echo          Continuando mesmo assim...
) else (
    echo        OK — migrations aplicadas.
)

:: ── 5. Inicia o servidor Next.js em nova janela ───────────────────────────────
echo.
echo  [5/5] Iniciando servidor Next.js na porta %PORT%...
cd /d "%ROOT%"

:: Abre em nova janela separada para nao bloquear este console
start "HelpDesk — Next.js Server" cmd /k "title HelpDesk ^| Next.js && color 0B && npm run dev"

:: Aguarda o servidor responder antes de abrir o browser
echo        Aguardando servidor responder...
set "waited=0"
:wait_server
    curl -s -o nul -w "%%{http_code}" "http://localhost:%PORT%/api/health" 2>nul | findstr /r "^2[0-9][0-9]$\|^3[0-9][0-9]$" >nul 2>&1
    if not errorlevel 1 goto :server_ready
    :: Fallback: testa simplesmente se a porta esta aberta
    powershell -Command "try { $c = New-Object Net.Sockets.TcpClient('localhost',%PORT%); $c.Close(); exit 0 } catch { exit 1 }" >nul 2>&1
    if not errorlevel 1 goto :server_ready
    set /a waited+=1
    if !waited! geq 60 goto :server_ready
    <nul set /p "=."
    timeout /t 1 /nobreak >nul
    goto :wait_server

:server_ready
echo.
echo        OK — Servidor no ar em http://localhost:%PORT%

:: Abre o browser
echo.
echo  Abrindo http://localhost:%PORT% no navegador...
start "" "http://localhost:%PORT%"

:: ── Resumo final ──────────────────────────────────────────────────────────────
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║  Sistema iniciado com sucesso!                       ║
echo  ║                                                      ║
echo  ║  App:     http://localhost:%PORT%                       ║
echo  ║  DB:      localhost:5432 / helpdesk_db              ║
echo  ║                                                      ║
echo  ║  Para parar: feche a janela "HelpDesk - Next.js"    ║
echo  ║              e rode  parar.bat  para o banco         ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
echo  Este console pode ser fechado com seguranca.
echo.
pause
endlocal
