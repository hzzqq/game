@echo off
setlocal
title Publish to GitHub

cd /d "%~dp0"

echo ============================================================
echo   Publish the local game hub to a NEW GitHub repository
echo   (Run this on a machine WITH internet access)
echo ============================================================
echo.

set /p GITHUB_USER=GitHub username: 
set /p REPO_NAME=New repository name (e.g. html5-game-hub): 
set /p GITHUB_TOKEN=GitHub PAT with 'repo' scope: 
set /p VIS=Private repository? (y/N): 

set "PRIVATE=false"
if /i "%VIS%"=="y"   set "PRIVATE=true"
if /i "%VIS%"=="yes" set "PRIVATE=true"

rem ---- Set git identity (the local commit used a placeholder) ----
git config user.name "%GITHUB_USER%"
git config user.email "%GITHUB_USER%@users.noreply.github.com"
rem Only rewrite the author on the first (not-yet-pushed) commit
git rev-parse --abbrev-ref @{u} >nul 2>&1 || git commit --amend --no-edit --reset-author >nul 2>&1

echo.
echo Creating GitHub repository "%REPO_NAME%" ...
curl -s -o nul -w "  API response: HTTP %{http_code}\n" ^
  -H "Authorization: Bearer %GITHUB_TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"%REPO_NAME%\",\"private\":%PRIVATE%,\"description\":\"HTML5 Game Hub - 31 dark financial-terminal-style games + automated test suite\"}" ^
  https://api.github.com/user/repos

echo.
echo Pushing to GitHub ...
git remote remove origin >nul 2>&1
git remote add origin https://%GITHUB_TOKEN%@github.com/%GITHUB_USER%/%REPO_NAME%.git
git branch -M main
git push -u origin main

echo.
echo Removing the token from the saved remote URL ...
git remote set-url origin https://github.com/%GITHUB_USER%/%REPO_NAME%.git

echo.
echo DONE. Open:  https://github.com/%GITHUB_USER%/%REPO_NAME%
echo (Your PAT was only used in memory and is NOT stored in .git/config)
pause
