const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const backendDir = path.join(__dirname, '..', 'backend');
const venvDir = path.join(backendDir, '.venv');

// Determine correct paths based on OS
const isWindows = os.platform() === 'win32';
const venvPythonStr = isWindows ? '.venv/Scripts/python.exe' : '.venv/bin/python';
const venvPython = path.join(backendDir, isWindows ? '.venv\\Scripts\\python.exe' : '.venv/bin/python');
const venvPip = path.join(backendDir, isWindows ? '.venv\\Scripts\\pip.exe' : '.venv/bin/pip');

// Helper to run command
function runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        console.log(`> ${command} ${args.join(' ')}`);
        const proc = spawn(command, args, { stdio: 'inherit', shell: true, ...options });
        
        proc.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Command failed with code ${code}`));
            } else {
                resolve();
            }
        });
    });
}

async function startBackend() {
    // 1. Check if venv exists, create if not
    const pythonExe = process.env.PYTHON_PATH || (isWindows ? 'python' : 'python3');
    
    // Check if python is available
    try {
        await runCommand(pythonExe, ['--version'], { stdio: 'ignore' });
    } catch (e) {
        console.error(`Error: '${pythonExe}' is not found. Please install Python.`);
        process.exit(1);
    }

    if (!fs.existsSync(venvDir)) {
        console.log('Creating virtual environment...');
        await runCommand(pythonExe, ['-m', 'venv', venvDir]);
    }

    // 2. Install requirements
    const requirementsPath = path.join(backendDir, 'requirements.txt');
    if (fs.existsSync(requirementsPath)) {
        console.log('Installing requirements...');
        await runCommand(venvPython, ['-m', 'pip', 'install', '-r', requirementsPath]);
    }

    // 3. Run Uvicorn
    console.log('Starting backend server...');
    // We run uvicorn module directly from the venv python to ensure we use the installed package
    const uvicornArgs = [
        '-m', 'uvicorn',
        'backend.app.main:app',
        '--reload',
        '--host', '127.0.0.1',
        '--port', '8000'
    ];
    
    // Note: We run this from the project root so python path resolves 'backend.app...' correctly
    // But we need to make sure the venv python is used.
    
    // When running module, sys.path typically includes current directory.
    // cwd should be project root (one level up from scripts).
    await runCommand(venvPython, uvicornArgs, { cwd: path.join(__dirname, '..') });
}

startBackend().catch(err => {
    console.error(err);
    process.exit(1);
});
