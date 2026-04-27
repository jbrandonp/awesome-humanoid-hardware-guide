import { symlink, existsSync, lstatSync, unlinkSync } from 'fs';
import { join, resolve } from 'path';

const [workspaceRootArg, projectRootArg] = process.argv.slice(2);

if (!workspaceRootArg || !projectRootArg) {
  console.error('Usage: node eas-build-post-install.mjs <workspaceRoot> <projectRoot>');
  process.exit(1);
}

const workspaceRoot = resolve(process.cwd(), workspaceRootArg);
const projectRoot = resolve(process.cwd(), projectRootArg);

const rootNodeModules = join(workspaceRoot, 'node_modules');
const projectNodeModules = join(projectRoot, 'node_modules');

console.log(`Workspace root: ${workspaceRoot}`);
console.log(`Project root: ${projectRoot}`);

if (!existsSync(rootNodeModules)) {
  console.error(`Error: Root node_modules not found at ${rootNodeModules}`);
  process.exit(1);
}

if (existsSync(projectNodeModules)) {
  const stats = lstatSync(projectNodeModules);
  if (stats.isSymbolicLink()) {
    console.log('Existing symlink detected. Removing it to ensure a fresh link...');
    unlinkSync(projectNodeModules);
  } else {
    console.log('Note: Project node_modules already exists as a physical directory. Skipping symlink to avoid data loss.');
    process.exit(0);
  }
}

console.log(`Linking ${projectNodeModules} -> ${rootNodeModules}`);

// Cross-platform symlink type
const symlinkType = process.platform === 'win32' ? 'junction' : 'dir';

symlink(
  rootNodeModules,
  projectNodeModules,
  symlinkType,
  (err) => {
    if (err) {
      console.error(`FATAL ERROR: Could not create symlink. Reason: ${err.message}`);
      process.exit(1);
    } else {
      console.log(`Symlink successfully created (${symlinkType} mode).`);
    }
  },
);
