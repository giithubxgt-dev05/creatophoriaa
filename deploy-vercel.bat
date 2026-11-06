@echo off
title Creatophoria Studio — Vercel Deployment
echo ========================================================
echo       CREATOPHORIA STUDIO — VERCEL PRODUCTION DEPLOY
echo ========================================================
echo.
cd /d A:\creatophoria

echo [1/2] Verifying Vercel Authentication...
call vercel whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo [Notice] Vercel login required. Opening browser for sign-in...
    call vercel login
)

echo.
echo [2/2] Deploying project to Vercel Production...
call vercel --prod

echo.
echo ========================================================
echo If this is your first deploy on Vercel, don't forget to
echo add your environment variables in Vercel Dashboard:
echo.
echo   SUPABASE_URL
echo   SUPABASE_ANON_KEY
echo   SUPABASE_SERVICE_ROLE_KEY
echo   ADMIN_KEY
echo ========================================================
pause
