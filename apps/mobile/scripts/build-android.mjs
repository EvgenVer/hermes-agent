import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'

const APP_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ANDROID_DIR = join(APP_DIR, 'android')
const require = createRequire(join(APP_DIR, 'package.json'))

const VARIANTS = new Set(['debug', 'release'])

function usage() {
  return `Usage: node scripts/build-android.mjs [options]

Builds the Android APK with the repository's existing Expo/Gradle toolchain.
No package installation is performed.

Options:
  --variant <debug|release>  Gradle variant (default: release)
  --prebuild                Run Expo CNG prebuild without installing packages
  --help                    Show this help
`
}

export function parseArgs(argv) {
  const options = { variant: 'release', prebuild: false, help: false }

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--help' || argument === '-h') {
      options.help = true
    } else if (argument === '--prebuild') {
      options.prebuild = true
    } else if (argument === '--variant') {
      const value = argv[++index]
      if (!value || !VARIANTS.has(value)) {
        throw new Error('--variant must be either debug or release')
      }
      options.variant = value
    } else {
      throw new Error(`Unknown option: ${argument}`)
    }
  }

  return options
}

function run(command, args, { cwd, env = process.env }) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, {
      cwd,
      env,
      shell: process.platform === 'win32',
      stdio: 'inherit',
    })

    child.on('error', rejectRun)
    child.on('close', (code, signal) => {
      if (code === 0) {
        resolveRun()
        return
      }
      rejectRun(new Error(`${command} ${args.join(' ')} failed with ${signal ? `signal ${signal}` : `exit code ${code}`}`))
    })
  })
}

function expoCliPath() {
  try {
    return require.resolve('expo/bin/cli', { paths: [APP_DIR] })
  } catch {
    throw new Error(
      'Expo CLI is not available from the existing workspace node_modules. Run the approved workspace install in the test environment, then retry; this helper never installs packages.',
    )
  }
}

function gradleCommand() {
  return process.platform === 'win32' ? 'gradlew.bat' : './gradlew'
}

function sdkFromLocalProperties() {
  const localProperties = join(ANDROID_DIR, 'local.properties')
  if (!existsSync(localProperties)) return null

  const line = readFileSync(localProperties, 'utf8')
    .split(/\r?\n/u)
    .find((entry) => entry.startsWith('sdk.dir='))
  if (!line) return null

  return line.slice('sdk.dir='.length).replaceAll('\\\\:', ':').replaceAll('\\\\\\\\', '\\')
}

function androidSdkRoot() {
  const defaults = process.platform === 'win32'
    ? [process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Android', 'Sdk')]
    : process.platform === 'darwin'
      ? [process.env.HOME && join(process.env.HOME, 'Library', 'Android', 'sdk')]
      : [process.env.HOME && join(process.env.HOME, 'Android', 'Sdk')]
  const candidates = [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT, sdkFromLocalProperties(), ...defaults]
    .filter(Boolean)

  const root = candidates.find((candidate) => existsSync(join(candidate, 'platform-tools')))
  if (!root) {
    throw new Error(
      `Android SDK was not found. Set ANDROID_HOME or ANDROID_SDK_ROOT to the approved SDK directory; checked ${candidates.join(', ') || 'no configured locations'}.`,
    )
  }
  return root
}

export async function buildAndroid({ variant = 'release', prebuild = false } = {}) {
  if (!VARIANTS.has(variant)) {
    throw new Error(`Unsupported Android variant: ${variant}`)
  }

  const gradleWrapper = join(ANDROID_DIR, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew')
  const sdkRoot = androidSdkRoot()
  const env = { ...process.env, ANDROID_HOME: sdkRoot, ANDROID_SDK_ROOT: sdkRoot }
  if (prebuild) {
    await run(process.execPath, [
      expoCliPath(),
      'prebuild',
      '--no-install',
      '--platform',
      'android',
    ], { cwd: APP_DIR, env })
  }

  if (!existsSync(gradleWrapper)) {
    throw new Error(
      `Android project is missing at ${ANDROID_DIR}. Run this command with --prebuild in the approved Docker/local test environment; no generated native tree is created implicitly.`,
    )
  }

  const task = `:app:assemble${variant[0].toUpperCase()}${variant.slice(1)}`
  await run(gradleCommand(), [task, '--no-daemon', '--console=plain'], { cwd: ANDROID_DIR, env })

  const apkPath = join(ANDROID_DIR, 'app', 'build', 'outputs', 'apk', variant, `app-${variant}.apk`)
  if (!existsSync(apkPath)) {
    throw new Error(`Gradle completed but did not produce the expected APK: ${apkPath}`)
  }

  return apkPath
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    process.stdout.write(usage())
    return
  }

  const apkPath = await buildAndroid(options)
  console.log(`Android ${options.variant} APK: ${apkPath}`)
  if (options.variant === 'release') {
    console.log('Release build completed. Signing and physical-device acceptance remain separate release gates.')
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`Android build failed: ${error.message}`)
    process.exitCode = 1
  })
}
