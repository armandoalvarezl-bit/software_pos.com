const fs = require('fs');
const s = fs.readFileSync('tools/pos.inline.js', 'utf8');

let line = 1;
let col = 0;
const stack = [];
let state = 'normal';
let tplExprDepth = 0;

function push() { stack.push({ line, col }); }
function pop() { stack.pop(); }

for (let i = 0; i < s.length; i++) {
  const c = s[i];
  const next = s[i + 1];

  if (c === '\n') {
    line++;
    col = 0;
  } else {
    col++;
  }

  if (state === 'line_comment') {
    if (c === '\n') state = 'normal';
    continue;
  }
  if (state === 'block_comment') {
    if (c === '*' && next === '/') {
      state = 'normal';
      i++;
      col++;
    }
    continue;
  }
  if (state === 'single') {
    if (c === '\\') {
      i++;
      col++;
      continue;
    }
    if (c === "'") state = tplExprDepth > 0 ? 'tpl_expr' : 'normal';
    continue;
  }
  if (state === 'double') {
    if (c === '\\') {
      i++;
      col++;
      continue;
    }
    if (c === '"') state = tplExprDepth > 0 ? 'tpl_expr' : 'normal';
    continue;
  }
  if (state === 'template') {
    if (c === '\\') {
      i++;
      col++;
      continue;
    }
    if (c === '`') {
      state = tplExprDepth > 0 ? 'tpl_expr' : 'normal';
      continue;
    }
    if (c === '$' && next === '{') {
      state = 'tpl_expr';
      tplExprDepth = 1;
      push();
      i++;
      col++;
      continue;
    }
    continue;
  }
  if (state === 'tpl_expr') {
    if (c === '/' && next === '/') {
      state = 'line_comment';
      i++;
      col++;
      continue;
    }
    if (c === '/' && next === '*') {
      state = 'block_comment';
      i++;
      col++;
      continue;
    }
    if (c === "'") {
      state = 'single';
      continue;
    }
    if (c === '"') {
      state = 'double';
      continue;
    }
    if (c === '`') {
      state = 'template';
      continue;
    }

    if (c === '{') {
      tplExprDepth++;
      push();
      continue;
    }
    if (c === '}') {
      tplExprDepth--;
      pop();
      if (tplExprDepth === 0) state = 'template';
      continue;
    }
    continue;
  }

  // normal
  if (c === '/' && next === '/') {
    state = 'line_comment';
    i++;
    col++;
    continue;
  }
  if (c === '/' && next === '*') {
    state = 'block_comment';
    i++;
    col++;
    continue;
  }
  if (c === "'") {
    state = 'single';
    continue;
  }
  if (c === '"') {
    state = 'double';
    continue;
  }
  if (c === '`') {
    state = 'template';
    continue;
  }
  if (c === '{') {
    push();
    continue;
  }
  if (c === '}') {
    pop();
    continue;
  }
}

if (stack.length) {
  console.log('Unmatched { count:', stack.length);
  console.log('Last unmatched { at:', stack[stack.length - 1]);
} else {
  console.log('Braces balanced (approx scanner)');
}
