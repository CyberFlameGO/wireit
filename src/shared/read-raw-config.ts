import {KnownError} from './known-error.js';
import {readPackageJson} from './read-package-json.js';

import type {RawPackageConfig} from '../types/config.js';

export const readRawConfig = async (
  packageJsonPath: string
): Promise<RawPackageConfig> => {
  const packageJson = await readPackageJson(packageJsonPath);

  // Require that any "wireit" script also be in the "scripts" section, and that
  // it delegates to the "wireit" binary.
  //
  // The main reason for this requirement is to remove a footgun with `npm run
  // --workspaces`. If we did not have this requirement, then it would be easy
  // to define a script in the "wireit" section of the package.json, but forget
  // to include it in the "scripts" list. When the user then runs `npm run foo
  // --workspaces --if-present`, they might expect the wireit script to run, but
  // npm would in fact never find it.
  for (const scriptName of Object.keys(packageJson.wireit ?? {})) {
    const npmScript = packageJson.scripts?.[scriptName];
    if (npmScript === undefined) {
      throw new KnownError(
        'missing-npm-script',
        `${scriptName} is configured in the "wireit" section ` +
          `of ${packageJsonPath}, but not the "scripts" section.`
      );
    }
    if (npmScript !== 'wireit') {
      throw new KnownError(
        'misconfigured-npm-script',
        `${scriptName} is configured in the "wireit" section ` +
          `of ${packageJsonPath}, but the "scripts" command ` +
          `is "${npmScript}" instead of "wireit".`
      );
    }
  }

  const scripts = packageJson.wireit ?? {};

  // Vanilla scripts are scripts too. They just won't have any freshness,
  // caching, or watch support.
  if (packageJson.scripts !== undefined) {
    for (const [scriptName, command] of Object.entries(packageJson.scripts)) {
      if (scripts[scriptName] === undefined) {
        scripts[scriptName] = {
          command,
        };
      }
    }
  }

  return {packageJsonPath, scripts};
};