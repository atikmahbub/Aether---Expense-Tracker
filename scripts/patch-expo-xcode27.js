/**
 * Xcode 27 removed the standalone Simulator.app and replaced it with Device Hub
 * (Xcode.app/Contents/Applications/DeviceHub.app). Expo SDK 54's CLI still looks
 * for Simulator.app, so `expo run:ios` / `expo start` on a simulator fail with
 * "Can't determine id of Simulator app".
 *
 * This patches the two CLI files that hard-code Simulator.app. It is idempotent
 * and a no-op on machines where Simulator.app still exists. Remove this script
 * (and the postinstall hook) once Expo ships official Xcode 27 support.
 */
const fs = require('fs');
const path = require('path');

const CLI = path.join(
  __dirname,
  '..',
  'node_modules/expo/node_modules/@expo/cli/build/src'
);
const MARKER = '/* xcode27-devicehub-patch */';

function patch(file, edits) {
  const full = path.join(CLI, file);
  if (!fs.existsSync(full)) {
    console.warn(`[xcode27] skip, not found: ${file}`);
    return;
  }
  let src = fs.readFileSync(full, 'utf8');
  if (src.includes(MARKER)) return;
  for (const [find, replace] of edits) {
    if (!src.includes(find)) {
      console.warn(`[xcode27] skip ${file}: anchor not found, Expo may have changed`);
      return;
    }
    src = src.replace(find, replace);
  }
  fs.writeFileSync(full, `${MARKER}\n${src}`);
  console.log(`[xcode27] patched ${file}`);
}

patch('start/doctor/apple/SimulatorAppPrerequisite.js', [
  [
    `        const result = await getSimulatorAppIdAsync();`,
    `        let result = await getSimulatorAppIdAsync();
        if (!result) {
            // Xcode 27+: Simulator.app is gone, Device Hub renders simulators instead.
            const { execFileSync } = require('child_process');
            try {
                const dev = execFileSync('xcode-select', [ '-p' ], { encoding: 'utf8' }).trim();
                if (require('fs').existsSync(require('path').join(dev, '../Applications/DeviceHub.app'))) {
                    result = 'com.apple.CoreSimulator.SimulatorTrampoline';
                }
            } catch  {}
        }`,
  ],
]);

patch('run/ios/options/resolveDevice.js', [
  [
    `    const devices = await (0, _promptAppleDevice.sortDefaultDeviceToBeginningAsync)((0, _array.uniqBy)((await Promise.all([
        _AppleDevice.getConnectedDevicesAsync(),
        await (0, _profile.profile)(_simctl.getDevicesAsync)()
    ])).flat(), (item)=>item.udid), osType);`,
    `    // Xcode 27+: devicectl now lists simulators too (Reality: simulated). Its entries
    // lack a CoreSimulator deviceType, so uniqBy keeping them first made simulators look
    // like physical devices and routed install through devicectl. Put simctl first.
    const devices = await (0, _promptAppleDevice.sortDefaultDeviceToBeginningAsync)((0, _array.uniqBy)((await Promise.all([
        await (0, _profile.profile)(_simctl.getDevicesAsync)(),
        _AppleDevice.getConnectedDevicesAsync()
    ])).flat(), (item)=>item.udid), osType);`,
  ],
]);

patch('start/platforms/ios/AppleDeviceManager.js', [
  [
    `        await _osascript().execAsync(\`tell application "Simulator" to activate\`);`,
    `        // Xcode 27+: the app is called Device Hub, and may not be scriptable.
        try {
            await _osascript().execAsync(\`tell application "Simulator" to activate\`);
        } catch  {
            try {
                await _osascript().execAsync(\`tell application "Device Hub" to activate\`);
            } catch  {
            // Not fatal: the app is installed and launched either way.
            }
        }`,
  ],
]);

patch('start/platforms/ios/ensureSimulatorAppRunning.js', [
  [
    `'tell app "System Events" to count processes whose name is "Simulator"'`,
    `'tell app "System Events" to count (processes whose name is "Simulator" or name is "DeviceHub")'`,
  ],
  [
    `async function openSimulatorAppAsync(device) {
    const args = [
        '-a',
        'Simulator'
    ];
    if (device.udid) {
        // This has no effect if the app is already running.
        args.push('--args', '-CurrentDeviceUDID', device.udid);
    }
    await (0, _spawnasync().default)('open', args);
}`,
    `async function openSimulatorAppAsync(device) {
    // Xcode 27+: boot via simctl and show the device in Device Hub.
    const fs = require('fs');
    const path = require('path');
    const { execFileSync } = require('child_process');
    let deviceHub = null;
    try {
        const dev = execFileSync('xcode-select', [ '-p' ], { encoding: 'utf8' }).trim();
        const candidate = path.join(dev, '../Applications/DeviceHub.app');
        if (fs.existsSync(candidate)) deviceHub = candidate;
    } catch  {}
    if (deviceHub) {
        if (device.udid) {
            try {
                await (0, _spawnasync().default)('xcrun', [ 'simctl', 'boot', device.udid ]);
            } catch  {
            // Already booted.
            }
        }
        await (0, _spawnasync().default)('open', [ deviceHub ]);
        return;
    }
    const args = [
        '-a',
        'Simulator'
    ];
    if (device.udid) {
        // This has no effect if the app is already running.
        args.push('--args', '-CurrentDeviceUDID', device.udid);
    }
    await (0, _spawnasync().default)('open', args);
}`,
  ],
]);
