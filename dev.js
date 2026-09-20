const { spawn } = require('child_process');
const path = require('path');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

function startProcess(name, dir, colorCode) {
  const command = isWindows ? 'npm.cmd run dev' : 'npm run dev';
  const child = spawn(command, {
    cwd: path.join(__dirname, dir),
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
  });

  const prefix = `\x1b[${colorCode}m[${name}]\x1b[0m `;

  child.stdout.on('data', (data) => {
    const lines = data.toString().split(/\r?\n/);
    lines.forEach((line) => {
      if (line.trim()) console.log(`${prefix}${line}`);
    });
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().split(/\r?\n/);
    lines.forEach((line) => {
      if (line.trim()) console.error(`${prefix}${line}`);
    });
  });

  child.on('close', (code) => {
    console.log(`${prefix}process exited with code ${code}`);
  });

  return child;
}

console.log('\x1b[32m🚀 Starting Flash Print: Backend on :5000 & Frontend on :3000...\x1b[0m\n');

const backend = startProcess('Backend', 'backend', '33'); // Yellow
const frontend = startProcess('Frontend', 'frontend', '36'); // Cyan

function shutdown() {
  console.log('\nStopping servers...');
  try {
    if (isWindows) {
      if (backend.pid) spawn('taskkill', ['/pid', backend.pid, '/f', '/t']);
      if (frontend.pid) spawn('taskkill', ['/pid', frontend.pid, '/f', '/t']);
    } else {
      backend.kill('SIGTERM');
      frontend.kill('SIGTERM');
    }
  } catch (e) {
    // Ignore cleanup errors
  }
  process.exit();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
