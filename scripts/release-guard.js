#!/usr/bin/env node
/**
 * Blocks a production build when the app version hasn't been bumped since the
 * last production build (run /final-touch first). Called by the `eas` wrapper
 * in ~/.zshrc before `eas build --profile production`.
 *
 * Exit 0 = OK to build, 1 = blocked. Bypass with SKIP_RELEASE_GUARD=1.
 */
/* global __dirname */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

if (process.env.SKIP_RELEASE_GUARD === "1") {
  console.log("⚠︎ Release guard skipped (SKIP_RELEASE_GUARD=1).");
  process.exit(0);
}

const fail = (msg) => {
  console.error(`✖ ${msg}`);
  console.error("  Bypass on purpose with SKIP_RELEASE_GUARD=1.");
  process.exit(1);
};

const compare = (a, b) => {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  }
  return 0;
};

const appJson = JSON.parse(fs.readFileSync(path.join(root, "app.json"), "utf8"));
const current = appJson.expo.version;
const displayVersion = appJson.expo.extra?.displayVersion;

let builds;
try {
  const out = execSync(
    "npx eas-cli build:list --platform android --profile production --status finished --limit 1 --non-interactive --json",
    { cwd: root, stdio: ["ignore", "pipe", "ignore"], timeout: 60000 },
  );
  builds = JSON.parse(out.toString());
} catch {
  fail("Couldn't read the last production build from EAS (offline or not logged in?).");
}

const last = builds[0];
if (last && compare(current, last.appVersion) <= 0) {
  fail(
    `Version is still ${current} (last production build ${last.appBuildVersion} was ${last.appVersion}). Run /final-touch first.`,
  );
}

if (displayVersion && displayVersion !== current) {
  fail(
    `Profile screen would show ${displayVersion} but the build is ${current}. Run /final-touch to sync them.`,
  );
}

console.log(`✔ Release guard: version ${current} is ready to build.`);
console.log("  Tip: run /release-note for the Play Console text.");
