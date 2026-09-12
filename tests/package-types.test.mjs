import assert from 'node:assert/strict'
import { test } from 'node:test'
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const root = fileURLToPath(new URL('../', import.meta.url))
const require = createRequire(import.meta.url)

test('published archive exposes strict types to Bundler and NodeNext consumers', () => {
  const temporary = mkdtempSync(join(tmpdir(), 'shapeshifter-types-'))
  try {
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
    const packed = JSON.parse(execFileSync(npm, [
      'pack', '--ignore-scripts', '--json', '--pack-destination', temporary,
    ], { cwd: root, encoding: 'utf8', env: { ...process.env, npm_config_cache: join(temporary, 'cache') } }))[0]
    assert.ok(packed.files.some((file) => file.path === 'dist/index.d.ts'))
    const install = join(temporary, 'node_modules/vue-shapeshifter-table')
    mkdirSync(install, { recursive: true })
    execFileSync('tar', ['-xzf', join(temporary, packed.filename), '-C', install, '--strip-components=1'])
    symlinkSync(dirname(require.resolve('vue/package.json')), join(temporary, 'node_modules/vue'), 'junction')
    cpSync(join(root, 'tests/types'), join(temporary, 'consumer'), { recursive: true })
    writeFileSync(join(temporary, 'package.json'), JSON.stringify({ type: 'module' }))
    const checker = require.resolve('vue-tsc/bin/vue-tsc.js')
    const args = [checker, '-p', join(temporary, 'consumer/tsconfig.json')]
    execFileSync(process.execPath, args, { cwd: temporary, stdio: 'pipe' })
    execFileSync(process.execPath, [...args, '--module', 'NodeNext', '--moduleResolution', 'NodeNext'], { cwd: temporary, stdio: 'pipe' })
  } finally {
    rmSync(temporary, { recursive: true, force: true })
  }
})
