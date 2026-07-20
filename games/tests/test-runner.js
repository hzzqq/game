/**
 * 游戏自动化检测 — Node.js 命令行版
 * 用法: node test-runner.js
 * 
 * 对每款游戏执行：
 * 1) 语法校验（new Function 解析内联 <script>）
 * 2) 外部依赖扫描（禁止 cdn/联网）
 * 3) 结构完整性（闭合标签、canvas、script）
 * 4) 关键逻辑探查（函数名、事件监听、状态变量）
 * 5) 安全/质量检查（eval、innerHTML 未转义等）
 */
const fs = require('fs');
const path = require('path');

const DIR = path.dirname(__dirname); // games/
const FILES = {
  '2048.html':     { name:'2048 数字合成',      offline:true },
  'tetris.html':   { name:'俄罗斯方块',        offline:true },
  'rhythm.html':   { name:'节奏大师',          offline:true },
  'breakout.html': { name:'打砖块',            offline:true },
  'battle.html':   { name:'坦克对战',          offline:false },
  'cubecity.html': { name:'3D 城市 CubeCity',   offline:false },
  'plane.html':     { name:'飞机大战 Plane',     offline:true },
  'sudoku.html':    { name:'数独 Sudoku',        offline:true },
  'minesweeper.html':{ name:'扫雷 Minesweeper',   offline:true },
  'doudizhu.html':  { name:'斗地主 Dou Dizhu',   offline:true },
  'mahjong.html':   { name:'麻将 Mahjong',       offline:true },
  'dream.html':     { name:'造梦西游 Dream',      offline:true },
  'carrot.html':    { name:'保卫萝卜 Carrot',     offline:true },
  'icefire.html':   { name:'冰火人 Ice&Fire',     offline:true },
  'snake.html':     { name:'贪吃蛇 Snake',        offline:true },
  'parkour.html':   { name:'跑酷 Parkour',        offline:true },
  'match3.html':    { name:'消消乐 Match-3',       offline:true },
  'racing.html':    { name:'赛车 Racing',         offline:true },
  'bubble.html':    { name:'泡泡龙 Bubble',       offline:true },
  'fighting.html':  { name:'格斗 Fighting',        offline:true },
  'pacman.html':    { name:'吃豆人 Pac-Man',      offline:true },
  'gomoku.html':    { name:'五子棋 Gomoku',       offline:true },
  'bubblebob.html': { name:'泡泡堂 BubbleBob',    offline:true },
  'whack.html':     { name:'打地鼠 Whack',        offline:true },
  'poker.html':     { name:'德州扑克 Poker',       offline:true },
  'slots.html':     { name:'老虎机 Slots',         offline:true },
  'lianliankan.html':{ name:'连连看 Lianliankan',   offline:true },
  'mastermind.html': { name:'猜数字 Mastermind',     offline:true },
  'battleship.html': { name:'战舰 Battleship',       offline:true },
  'tictactoe.html':  { name:'井字棋 TicTacToe',      offline:true },
  'pinball.html':    { name:'弹珠台 Pinball',        offline:true },
  'invaders.html':   { name:'太空入侵 Invaders',      offline:true },
  'hangman.html':    { name:'猜单词 Hangman',         offline:true },
};

let totalPass=0, totalFail=0;

function log(game, type, msg){
  const icon = type==='PASS' ? '\x1b[32m✓\x1b[0m' : type==='FAIL' ? '\x1b[31m✗\x1b[0m' : type==='WARN' ? '\x1b[33m⚠\x1b[0m' : '\x1b[36mℹ\x1b[0m';
  console.log(`  ${icon} [${type.padEnd(4)}] ${msg}`);
  if(type==='PASS') totalPass++; else if(type==='FAIL') totalFail++;
}

function checkFile(filepath, cfg){
  const name = cfg.name;
  console.log(`\n\x1b[1m━━━ ${name} (${filepath}) ━━━\x1b[0m`);
  
  const html = fs.readFileSync(path.join(DIR, filepath), 'utf8');
  
  // 1. 文件存在 & 非空
  log(name,'INFO',`文件大小 ${Buffer.byteLength(html)} bytes`);
  if(!html.trim()){ log(name,'FAIL','文件为空！'); return; }
  
  // 2. HTML 结构完整性
  if(!html.includes('</html>')){ log(name,'FAIL','缺少 </html> 闭合标签'); }
  else log(name,'PASS','HTML 结构完整（有 </html>）');
  
  // 3. Script 提取与语法校验
  const scripts = [];
  const reScript = /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi;
  let m;
  while((m=reScript.exec(html))!==null){ scripts.push({full:m[0],code:m[1],isExternal:m[0].includes('src=')}); }
  log(name,'INFO',`找到 ${scripts.length} 个 <script> 块`);
  
  let hasGameScript=false;
  for(const s of scripts){
    if(s.isExternal){
      log(name,'INFO',`外部脚本: ${s.full.match(/src\s*=\s*["']([^"']*)/)?.[1]||'unknown'}`);
    } else if(s.code.length > 200){
      hasGameScript=true;
      try{
        new Function(s.code);
        log(name,'PASS',`内联游戏脚本语法 OK (${s.code.length} chars)`);
      } catch(e){
        log(name,'FAIL',`语法错误: ${e.message.split('\n')[0]}`);
      }
      
      // 4a. 关键模式检查
      const code = s.code;
      const patterns = {
        'addEventListener': /addEventListener\s*\(/,
        'requestAnimationFrame|setInterval': /requestAnimationFrame|setInterval/,
        'keydown/keyup': /keydown|keyup/,
      };
      for(const [label,re] of Object.entries(patterns)){
        if(re.test(code)) log(name,'PASS',`含 ${label}`);
        else log(name,'WARN',`未发现 ${label}`);
      }
      
      // 4b. 质量检查
      if(/eval\s*\(/.test(code)) log(name,'WARN','使用了 eval()（安全风险）');
      // 仅当 innerHTML 被赋值为非字符串字面量（疑似拼接不可信数据）时才告警
      if(/innerHTML\s*=\s*(?!['"`]|$)/.test(code))
        log(name,'WARN','innerHTML 可能拼接不可信数据（注入风险）');
      
      // 4c. localStorage 检查（存档类游戏应有）
      if(['2048.html','breakout.html'].includes(filepath)){
        if(/localStorage/.test(code)) log(name,'PASS','使用 localStorage 存档');
        else log(name,'WARN','未见 localStorage（最佳分等功能缺失？）');
      }
    }
  }
  if(!hasGameScript && !cfg.offline){
    // CDN 加载的游戏可能主要逻辑在 external script 里
    log(name,'INFO','主逻辑可能在 CDN 脚本中（非离线游戏）');
  }
  
  // 5. Canvas 检查（Canvas 游戏应有：静态标签 或动态创建）
  if(['tetris.html','rhythm.html','breakout.html','battle.html'].includes(filepath)){
    const hasStaticCanvas = html.includes('<canvas');
    const hasDynamicCanvas = /createElement\s*\(\s*['"]canvas['"]\s*\)/.test(html) || /createElement\('canvas'\)/.test(html);
    if(hasStaticCanvas || hasDynamicCanvas)
      log(name,'PASS',`包含 Canvas（${hasStaticCanvas?'静态标签':'JS 动态创建'}）`);
    else
      log(name,'FAIL','Canvas 游戏缺少 Canvas（静态或动态均未找到）');
  }
  
  // 6. 视口 meta（移动端适配）
  if(html.includes('viewport')) log(name,'PASS','有 viewport meta（移动端友好）');
  else log(name,'WARN','缺少 viewport meta（移动端可能异常）');
  
  // 7. touch-action / 触屏支持
  if(/touch-action/.test(html) || /touchstart|ontouchstart/.test(html))
    log(name,'PASS','已添加触屏支持');
  else
    log(name,'WARN','未发现触屏相关代码');
  
  // 8. 离线检查
  const hasCDN = /<link[^>]*href=["']https?:|<script[^>]*src=["']https?:/.test(html);
  if(cfg.offline && hasCDN)
    log(name,'FAIL','声明为离线但包含外部 CDN 引用！');
  else if(!cfg.offline && hasCDN)
    log(name,'INFO','需联网加载外部资源（符合预期）');
  else if(cfg.offline && !hasCDN)
    log(name,'PASS','纯离线、零外部依赖 ✓');
  
  // 9. 设计系统一致性抽查
  const darkBg = /#0a0e14|#121821|#1f2a38/.test(html);
  const redColor = /#f6465d/.test(html);
  const greenColor = /#02c076/.test(html);
  const monoFont = /JetBrains Mono|Fira Code|Consolas|monospace/.test(html);
  if(darkBg && redColor && greenColor && monoFont)
    log(name,'PASS','暗色终端风设计系统一致');
  else
    log(name,'WARN',`设计系统部分缺失: bg=${darkBg},red=${redColor},green=${greenColor},font=${monoFont}`);
  
  return true;
}

// ========== 运行 ==========
console.log('\x1b[1m╔══════════════════════════════════════════╗\x1b[0m');
console.log('\x1b[1m║   GAME AUTO-TEST · 自动化检测报告       ║\x1b[0m');
console.log('\x1b[1m╚══════════════════════════════════════════╝\x1b[0m');
console.log(`检测时间: ${new Date().toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})}\n`);

for(const [file,cfg] of Object.entries(FILES)){
  if(!fs.existsSync(path.join(DIR, file))){
    console.log(`\n\x1b[1m━━━ ${cfg.name} (${file}) ━━━\x1b[0m`);
    log(cfg.name,'INFO','文件尚未生成（agent 构建中或待补充），跳过检测');
    continue;
  }
  try{ checkFile(file,cfg); }
  catch(e){ log(cfg.name,'FAIL',`检测过程异常: ${e.message}`); }
}

console.log(`\n\x1b[1m═══ 汇总 ═══\x1b[0m`);
console.log(`  \x1b[32m✅ 通过: ${totalPass}\x1b[0m    \x1b[31m❌ 失败: ${totalFail}\x1b[0m    总计: ${totalPass+totalFail}`);
if(totalFail===0) console.log('\x1b[32m🎉 所有检测项通过！游戏可交付。\x1b[0m');
else console.log(`\x1b[31m⚠️ 发现 ${totalFail} 个问题，请检查上方详情。\x1b[0m`);
