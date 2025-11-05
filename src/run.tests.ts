const server = new Deno.Command(Deno.execPath(), {
  args: ['run', '-A', 'src/main.ts'],
  stdin: 'null',
  stdout: 'inherit',
  stderr: 'null',
}).spawn()

await new Promise((r) => setTimeout(r, 1000))

const testResult = await new Deno.Command(Deno.execPath(), {
  args: ['test', '-A', 'src/main.test.ts'],
  stdout: 'inherit',
  stderr: 'inherit',
}).output()

server.kill('SIGTERM')
Deno.exit(testResult.code)
