@echo off
setlocal
title Game Hub Launcher

rem ============================================================
rem  游戏大厅启动器 (Game Hub Launcher)
rem  - 直接用默认浏览器打开 同目录的 index.html (file:// 即可运行)。
rem  - 全部游戏均为离线内联脚本，无任何 ES module / 本地 import；
rem    外部依赖(cubecity 的 Three.js、battle 的 PeerJS) 走 CDN，
rem    需联网，浏览器有网即可加载。
rem  - 因此无需本地服务器，双击即开，最稳妥、不依赖任何运行时。
rem
rem  如需本地服务器(例如想用 http://localhost 访问):
rem    在本目录打开命令行，执行下面任一命令，再访问 http://localhost:8765/
rem      python -m http.server 8765        (需系统自带 Python，非应用商店占位符)
rem      npx --yes http-server -p 8765 .   (需联网下载 http-server)
rem ============================================================

cd /d "%~dp0"
start "" "%~dp0index.html"

endlocal
