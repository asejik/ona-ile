// Builds the Android debug APK: web build, copy into the Android project, then Gradle.
// Gradle 8.14 (Capacitor 8) needs Java 21; this finds a JDK 21 if JAVA_HOME isn't one already.
import { execSync, spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const isWin = process.platform === 'win32';

function javaMajor(home) {
  const bin = join(home, 'bin', isWin ? 'java.exe' : 'java');
  if (!existsSync(bin)) return 0;
  const out = spawnSync(bin, ['-version'], { encoding: 'utf8' }).stderr ?? '';
  const m = out.match(/version "(\d+)/);
  return m ? Number(m[1]) : 0;
}

function findJdk21() {
  if (process.env.JAVA_HOME && javaMajor(process.env.JAVA_HOME) === 21) return process.env.JAVA_HOME;
  const roots = isWin
    ? ['C:/Program Files/Eclipse Adoptium', 'C:/Program Files/Java', 'C:/Program Files/Microsoft']
    : ['/usr/lib/jvm', '/Library/Java/JavaVirtualMachines'];
  for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const dir of readdirSync(root)) {
      for (const home of [join(root, dir), join(root, dir, 'Contents', 'Home')]) {
        if (javaMajor(home) === 21) return home;
      }
    }
  }
  return null;
}

const jdk = findJdk21();
if (!jdk) {
  console.error(
    'Java 21 is needed for the Android build (Gradle 8.14 cannot run on newer Java).\n' +
      'Install "Temurin 21 (LTS)" from https://adoptium.net/temurin/releases/?version=21 and run this again.',
  );
  process.exit(1);
}
console.log(`Using Java 21 at ${jdk}`);

// Fixed command lines with no user input, so running them through the shell is safe.
const run = (command, opts = {}) => execSync(command, { stdio: 'inherit', ...opts });
run('npm run build');
run('npx cap sync android');
// A full, quoted path: Windows doesn't always search the current folder for programs.
const gradlew = join(process.cwd(), 'android', isWin ? 'gradlew.bat' : 'gradlew');
run(`"${gradlew}" assembleDebug`, { cwd: 'android', env: { ...process.env, JAVA_HOME: jdk } });
console.log('\nAPK: android/app/build/outputs/apk/debug/app-debug.apk');
