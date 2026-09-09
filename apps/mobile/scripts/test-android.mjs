import { execFile, spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const APP_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PACKAGE_NAME = 'com.evgenver.hermesmobile'
const BUILD_SCRIPT = join(APP_DIR, 'scripts', 'build-android.mjs')

function usage() {
  return `Usage: node scripts/test-android.mjs --device <serial> --api <31|37> [options]

Installs and launches the release APK on one explicit Android target.
The release APK contains the production JS bundle and does not use Metro.
No package installation is performed.

Required:
  --device <serial>         adb serial, for example emulator-5554
  --api <31|37>             expected Android API level of that target

Options:
  --apk <path>              use an existing release APK instead of building
  --prebuild                run CNG prebuild before the release build
  --help                    show this help
`
}

export function parseArgs(argv) {
  const options = { device: null, api: null, apk: null, prebuild: false, help: false }

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--help' || argument === '-h') {
      options.help = true
    } else if (argument === '--prebuild') {
      options.prebuild = true
    } else if (argument === '--device' || argument === '--api' || argument === '--apk') {
      const value = argv[++index]
      if (!value) {
        throw new Error(`${argument} requires a value`)
      }
      if (argument === '--device') options.device = value
      if (argument === '--api') options.api = value
      if (argument === '--apk') options.apk = resolve(APP_DIR, value)
    } else {
      throw new Error(`Unknown option: ${argument}`)
    }
  }

  if (!options.help && !options.device) throw new Error('--device is required')
  if (!options.help && !['31', '37'].includes(options.api)) throw new Error('--api must be 31 or 37')
  if (options.apk && options.prebuild) throw new Error('--prebuild cannot be used with --apk')
  return options
}

function capture(command, args, { allowFailure = false } = {}) {
  return new Promise((resolveCapture, rejectCapture) => {
    execFile(command, args, { cwd: APP_DIR, encoding: 'utf8', timeout: 15_000 }, (error, stdout, stderr) => {
      if (error && !allowFailure) {
        const detail = stderr.trim() || stdout.trim() || error.message
        rejectCapture(new Error(`${command} ${args.join(' ')} failed: ${detail}`))
        return
      }
      resolveCapture({ code: error?.code ?? 0, stdout, stderr })
    })
  })
}

function run(command, args) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, {
      cwd: APP_DIR,
      env: process.env,
      shell: process.platform === 'win32',
      stdio: 'inherit',
    })
    child.on('error', rejectRun)
    child.on('close', (code, signal) => {
      if (code === 0) resolveRun()
      else rejectRun(new Error(`${command} ${args.join(' ')} failed with ${signal ? `signal ${signal}` : `exit code ${code}`}`))
    })
  })
}

function resolveAdb() {
  const sdkRoots = [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT].filter(Boolean)
  const localProperties = join(APP_DIR, 'android', 'local.properties')
  if (existsSync(localProperties)) {
    const sdkLine = readFileSync(localProperties, 'utf8')
      .split(/\r?\n/u)
      .find((entry) => entry.startsWith('sdk.dir='))
    if (sdkLine) sdkRoots.push(sdkLine.slice('sdk.dir='.length).replaceAll('\\\\:', ':').replaceAll('\\\\\\\\', '\\'))
  }
  const candidates = [
    process.env.ADB,
    ...sdkRoots.map((root) => join(root, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb')),
  ].filter(Boolean)

  return candidates.find((candidate) => existsSync(candidate)) ?? 'adb'
}

async function adb(args, options = {}) {
  try {
    return await capture(resolveAdb(), args, options)
  } catch (error) {
    throw new Error(
      `${error.message}. Ensure Android platform-tools are installed in the approved environment and adb is on PATH or exposed through ANDROID_HOME/ANDROID_SDK_ROOT.`,
    )
  }
}

async function readPid(device) {
  const result = await adb(['-s', device, 'shell', 'pidof', PACKAGE_NAME], { allowFailure: true })
  return result.stdout.trim()
}

async function waitForPid(device, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const pid = await readPid(device)
    if (pid) return pid
    await new Promise((resolveWait) => setTimeout(resolveWait, 250))
  }
  return ''
}

async function waitForExit(device, timeoutMs = 5_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (!(await readPid(device))) return
    await new Promise((resolveWait) => setTimeout(resolveWait, 250))
  }
  throw new Error(`Package ${PACKAGE_NAME} did not stop after force-stop on ${device}`)
}

async function launch(device) {
  await adb(['-s', device, 'shell', 'monkey', '-p', PACKAGE_NAME, '1'])
  const pid = await waitForPid(device)
  if (!pid) throw new Error(`Package ${PACKAGE_NAME} did not start on ${device}`)
  return pid
}

export async function testAndroid({ device, api, apk, prebuild = false }) {
  const state = (await adb(['-s', device, 'get-state'])).stdout.trim()
  if (state !== 'device') throw new Error(`adb target ${device} is not ready (state: ${state || 'unknown'})`)

  const sdk = (await adb(['-s', device, 'shell', 'getprop', 'ro.build.version.sdk'])).stdout.trim()
  if (sdk !== api) throw new Error(`adb target ${device} reports API ${sdk}, but --api ${api} was requested`)

  const apkPath = apk ?? await (async () => {
    await run(process.execPath, [BUILD_SCRIPT, '--variant', 'release', ...(prebuild ? ['--prebuild'] : [])])
    return join(APP_DIR, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk')
  })()
  if (!existsSync(apkPath)) throw new Error(`Release APK does not exist: ${apkPath}`)

  await adb(['-s', device, 'install', '-r', apkPath])
  const firstPid = await launch(device)
  await adb(['-s', device, 'shell', 'am', 'force-stop', PACKAGE_NAME])
  await waitForExit(device)
  const secondPid = await launch(device)
  if (firstPid === secondPid) throw new Error(`Package ${PACKAGE_NAME} reused PID ${firstPid}; restart was not observed`)

  return { device, api, apkPath, firstPid, secondPid }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    process.stdout.write(usage())
    return
  }

  const result = await testAndroid(options)
  console.log(`Android API ${result.api} release smoke passed on ${result.device}`)
  console.log(`Restart PIDs: ${result.firstPid} -> ${result.secondPid}`)
  console.log('This is a release-bundle launch/restart check; signing and Stage 1 physical-device acceptance remain separate gates.')
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`Android E2E failed: ${error.message}`)
    process.exitCode = 1
  })
}
