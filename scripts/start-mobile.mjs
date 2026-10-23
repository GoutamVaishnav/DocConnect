import { networkInterfaces } from 'node:os';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const bundledNpmCli = join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
const npmCli = process.env.npm_execpath || (existsSync(bundledNpmCli) ? bundledNpmCli : undefined);
const gatewayUrl = 'http://127.0.0.1:3000/api/v1';
const children = [];

function getLanIpAddress() {
  const networkEntries = Object.entries(networkInterfaces());
  const physicalEntries = networkEntries.filter(([name]) => !/(hyper-v|virtual|vmware|wsl|loopback)/i.test(name));
  const preferredEntries = physicalEntries.length > 0 ? physicalEntries : networkEntries;

  for (const [, addresses] of preferredEntries) {
    const ipv4 = addresses?.find((address) => (
      address.family === 'IPv4'
      && !address.internal
      && !address.address.startsWith('169.254.')
    ));

    if (ipv4) {
      return ipv4.address;
    }
  }

  return undefined;
}

async function gatewayIsReady() {
  try {
    const response = await fetch(gatewayUrl, { signal: AbortSignal.timeout(1_000) });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForGateway() {
  const deadline = Date.now() + 20_000;

  while (Date.now() < deadline) {
    if (await gatewayIsReady()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return false;
}

function runNpm(argumentsList, environment = process.env) {
  const command = npmCli ? process.execPath : process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const commandArguments = npmCli ? [npmCli, ...argumentsList] : argumentsList;
  const child = spawn(command, commandArguments, {
    cwd: projectRoot,
    env: environment,
    stdio: 'inherit',
  });
  children.push(child);
  return child;
}

function stopChildren() {
  children.forEach((child) => {
    if (!child.killed) {
      child.kill('SIGINT');
    }
  });
}

process.on('SIGINT', () => {
  stopChildren();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stopChildren();
  process.exit(0);
});

if (!(await gatewayIsReady())) {
  console.log('Starting DocConnect API gateway...');
  runNpm(['run', 'dev', '--workspace', '@docconnect/api-gateway']);

  if (!(await waitForGateway())) {
    console.error('The API gateway did not become ready on port 3000. Check its output above.');
    stopChildren();
    process.exit(1);
  }
} else {
  console.log('DocConnect API gateway is already running on port 3000.');
}

const lanIpAddress = getLanIpAddress();
const apiBaseUrl = lanIpAddress ? `http://${lanIpAddress}:3000` : process.env.EXPO_PUBLIC_API_BASE_URL;

if (!apiBaseUrl) {
  console.error('Could not detect a LAN IP address. Connect to Wi-Fi or Ethernet, then run the command again.');
  stopChildren();
  process.exit(1);
}

console.log(`Mobile API address: ${apiBaseUrl}`);
const mobileProcess = runNpm(
  ['run', 'start', '--workspace', '@docconnect/mobile', '--', ...process.argv.slice(2)],
  { ...process.env, EXPO_PUBLIC_API_BASE_URL: apiBaseUrl },
);

mobileProcess.once('exit', (code) => {
  stopChildren();
  process.exitCode = code ?? 0;
});
