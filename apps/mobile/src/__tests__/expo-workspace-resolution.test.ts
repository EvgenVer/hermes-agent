interface ChildProcessApi {
  execFileSync(
    file: string,
    args: string[],
    options: { cwd: string; encoding: 'utf8' }
  ): string;
}

describe('Expo workspace resolution', () => {
  it('lets the hoisted Expo CLI resolve the Router context entrypoint', () => {
    const appRoot = /[\\/]apps[\\/]mobile$/.test(process.cwd())
      ? process.cwd()
      : `${process.cwd()}/apps/mobile`;
    const probe = [
      "const { dirname } = require('node:path');",
      "const cli = require.resolve('@expo/cli');",
      "const routerServer = require.resolve('@expo/router-server/build/typed-routes/index.js', { paths: [dirname(cli)] });",
      "require.resolve('expo-router/_ctx-shared', { paths: [dirname(routerServer)] });",
    ].join(' ');
    // The child process must use Node's resolver rather than Jest's virtual resolver.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const childProcess = require('child_process') as unknown as ChildProcessApi;

    expect(() =>
      childProcess.execFileSync(process.execPath, ['-e', probe], {
        cwd: appRoot,
        encoding: 'utf8',
      })
    ).not.toThrow();
  });
});
