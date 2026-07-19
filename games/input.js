// games/input.js — 共享输入层（修复「断触」的根因）
// 问题根因：多数小游戏用「每帧采样按键电平」做边沿判断，快速点按/失焦卡键会丢输入。
// 本层提供：边沿检测(pressed)、动作缓冲(consume/buffer)、失焦清空、统一键盘+触控+虚拟按钮。
// 用法：<script src="input.js"></script> 然后 Input.init()；每帧逻辑里用 Input.pressed/down/consume，帧末调 Input.update()。
(function () {
  'use strict';
  var down = Object.create(null);        // 逻辑动作当前是否按住
  var pressedEdge = Object.create(null); // 本帧刚按下（边沿，只触发一次）
  var releasedEdge = Object.create(null);// 本帧刚抬起
  var buffers = Object.create(null);     // 动作缓冲：{action: 过期帧}
  var frame = 0;
  var keymap = {};
  var prevent = new Set();
  var started = false;

  var DEFAULT_KEYMAP = {
    'ArrowLeft': 'left', 'KeyA': 'left',
    'ArrowRight': 'right', 'KeyD': 'right',
    'ArrowUp': 'up', 'KeyW': 'up',
    'ArrowDown': 'down', 'KeyS': 'down',
    'Space': 'a', 'KeyJ': 'a', 'KeyZ': 'a',
    'KeyK': 'b', 'KeyX': 'b',
    'KeyL': 'c', 'KeyC': 'c',
    'Enter': 'start', 'NumpadEnter': 'start',
    'Escape': 'pause',
    'ShiftLeft': 'dash', 'ShiftRight': 'dash'
  };

  function setAction(action, isDown) {
    if (isDown) {
      if (!down[action]) pressedEdge[action] = true;
      down[action] = true;
    } else {
      if (down[action]) releasedEdge[action] = true;
      down[action] = false;
    }
  }

  function handleKeyDown(e) {
    if (prevent.has(e.code)) e.preventDefault();
    if (e.repeat) return; // 忽略系统自动重复，只认真实边沿
    var a = keymap[e.code];
    if (a) setAction(a, true);
  }
  function handleKeyUp(e) {
    var a = keymap[e.code];
    if (a) setAction(a, false);
  }
  function clearAll() {
    for (var k in down) down[k] = false;
    for (var k2 in pressedEdge) pressedEdge[k2] = false;
    for (var k3 in releasedEdge) releasedEdge[k3] = false;
    // 缓冲保留到帧末统一清理，避免在 blur 瞬间误用
  }

  function bindButton(el, action) {
    if (!el) return;
    var on = function (e) { e.preventDefault(); if (!down[action]) pressedEdge[action] = true; down[action] = true; };
    var off = function (e) { e.preventDefault(); if (down[action]) releasedEdge[action] = true; down[action] = false; };
    el.addEventListener('pointerdown', on);
    el.addEventListener('pointerup', off);
    el.addEventListener('pointercancel', off);
    el.addEventListener('pointerleave', off);
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }
  function bindVirtualButtons(root) {
    root = root || document;
    var els = root.querySelectorAll('[data-action]');
    for (var i = 0; i < els.length; i++) bindButton(els[i], els[i].getAttribute('data-action'));
  }

  var Api = {
    init: function (opts) {
      opts = opts || {};
      keymap = Object.assign({}, DEFAULT_KEYMAP, opts.keymap || {});
      prevent = new Set(opts.preventDefault || ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);
      if (!started) {
        started = true;
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('blur', clearAll);
        document.addEventListener('visibilitychange', function () { if (document.hidden) clearAll(); });
      }
      return Api;
    },
    down: function (a) { return !!down[a]; },
    pressed: function (a) { return !!pressedEdge[a]; },     // 本帧刚按下（边沿）
    released: function (a) { return !!releasedEdge[a]; },
    // 缓冲：一次按下延长 frames 帧有效，专治快速点按/卡键丢输入
    buffer: function (a, frames) { buffers[a] = frame + (frames || 8); },
    consume: function (a, frames) {
      frames = frames || 8;
      if (pressedEdge[a]) { buffers[a] = frame + frames; return true; }
      if (buffers[a] && buffers[a] >= frame) return true;
      return false;
    },
    any: function (list) { for (var i = 0; i < list.length; i++) if (down[list[i]]) return true; return false; },
    pressedAny: function (list) { for (var i = 0; i < list.length; i++) if (pressedEdge[list[i]]) return true; return false; },
    bindButton: bindButton,
    bindVirtualButtons: bindVirtualButtons,
    update: function () {
      for (var k in pressedEdge) pressedEdge[k] = false;
      for (var k2 in releasedEdge) releasedEdge[k2] = false;
      for (var k3 in buffers) { if (buffers[k3] < frame) delete buffers[k3]; }
      frame++;
    },
    clearAll: clearAll
  };
  window.Input = Api;
})();
