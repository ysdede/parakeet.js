import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const GH_REPO = 'git@github.com:ysdede/parakeet.js.git';
const GH_PAGES_BRANCH = 'gh-pages';
const DIST_DIR = path.join(__dirname, '../dist');
const TEMP_DIR = path.join(__dirname, '../temp_gh_deploy');
const PROJECT_ROOT = path.join(__dirname, '..');

// Run a command and print its output
const runCommand = (command, cwd = process.cwd(), ignoreError = false) => {
  console.log(`🔄 Running: ${command}`);
  try {
    const output = execSync(command, { cwd, stdio: 'pipe' }).toString();
    console.log(output);
    return { success: true, output };
  } catch (error) {
    console.error(`❌ Error executing command: ${command}`);
    console.error(error.message);
    if (!ignoreError) {
      throw error;
    }
    return { success: false, error };
  }
};

// Check if dist directory exists
const checkDistDirectory = () => {
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ dist directory not found. Run "npm run build" first.');
    process.exit(1);
  }
  console.log('✅ dist directory exists');
};

// Create a temporary directory for gh-pages
const setupTempDirectory = () => {
  console.log('🚀 Setting up temporary directory for GitHub Pages...');
  
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }
  
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  console.log('✅ Temporary directory created');
};

// Initialize git repo and set up gh-pages branch
const setupGitRepo = () => {
  console.log(`🚀 Setting up git repository...`);
  
  // Try to clone gh-pages branch
  const cloneResult = runCommand(`git clone --branch ${GH_PAGES_BRANCH} --single-branch ${GH_REPO} .`, TEMP_DIR, true);
  
  if (!cloneResult.success) {
    // If gh-pages doesn't exist, create orphan branch
    console.log('⚠️ gh-pages branch not found, creating new orphan branch');
    runCommand('git init', TEMP_DIR);
    runCommand(`git remote add origin ${GH_REPO}`, TEMP_DIR);
    runCommand(`git checkout --orphan ${GH_PAGES_BRANCH}`, TEMP_DIR);
    console.log('✅ New orphan branch created');
  } else {
    console.log('✅ Repository cloned successfully');
  }
};

// Clean the temporary directory (keep only .git folder)
const cleanTempDir = () => {
  console.log('🧹 Cleaning temporary directory...');
  
  const items = fs.readdirSync(TEMP_DIR);
  
  for (const item of items) {
    if (item !== '.git') {
      const itemPath = path.join(TEMP_DIR, item);
      if (fs.lstatSync(itemPath).isDirectory()) {
        fs.rmSync(itemPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(itemPath);
      }
    }
  }
  
  console.log('✅ Temporary directory cleaned');
};

// Get git information from the source repository
const getGitInfo = () => {
  try {
    const branch = runCommand('git rev-parse --abbrev-ref HEAD', PROJECT_ROOT, true).output?.trim() || 'unknown';
    const commitId = runCommand('git rev-parse --short HEAD', PROJECT_ROOT, true).output?.trim() || 'unknown';
    return { branch, commitId };
  } catch (error) {
    return { branch: 'unknown', commitId: 'unknown' };
  }
};

// Copy build files to temporary directory
const copyBuildFiles = () => {
  console.log('📂 Copying build files to temporary directory...');
  
  const distFiles = fs.readdirSync(DIST_DIR);
  for (const file of distFiles) {
    const srcPath = path.join(DIST_DIR, file);
    const destPath = path.join(TEMP_DIR, file);
    
    if (fs.lstatSync(srcPath).isDirectory()) {
      fs.cpSync(srcPath, destPath, { recursive: true });
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
  
  // Create .nojekyll file to disable Jekyll processing
  fs.writeFileSync(path.join(TEMP_DIR, '.nojekyll'), '');
  
  // Create git-info.json
  const gitInfo = getGitInfo();
  fs.writeFileSync(
    path.join(TEMP_DIR, 'git-info.json'),
    JSON.stringify(gitInfo, null, 2)
  );
  console.log(`Created git-info.json with branch: ${gitInfo.branch}, commit: ${gitInfo.commitId}`);
  
  console.log('✅ Build files copied to temporary directory');
};

// Commit and push changes
const commitAndPush = () => {
  console.log('🚀 Checking for changes and pushing to GitHub Pages...');
  
  runCommand('git add .', TEMP_DIR);
  
  const statusResult = runCommand('git status --porcelain', TEMP_DIR, true);
  
  if (!statusResult.output || statusResult.output.trim() === '') {
    console.log('✅ No changes detected. Repository is already up to date.');
    return;
  }
  
  const gitInfo = getGitInfo();
  const timestamp = new Date().toISOString();
  console.log('Changes detected, committing...');
  runCommand(`git commit -m "Deploy: ${timestamp} [${gitInfo.branch}:${gitInfo.commitId}]"`, TEMP_DIR);
  
  console.log('Force pushing to gh-pages branch...');
  const pushResult = runCommand(`git push -u origin ${GH_PAGES_BRANCH} --force`, TEMP_DIR, true);
  
  if (pushResult.success) {
    console.log('✅ Successfully pushed to gh-pages branch');
  } else {
    console.error('❌ Failed to push to gh-pages branch');
    throw new Error('Failed to push changes to GitHub Pages');
  }
};

// Clean up temporary directory
const cleanUp = () => {
  console.log('🧹 Cleaning up temporary directory...');
  
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }
  
  console.log('✅ Cleanup complete');
};

// Main function
const main = async () => {
  console.log('🚀 Starting deployment to GitHub Pages...');
  
  // Build the project first
  try {
    runCommand('npm run build', PROJECT_ROOT);
  } catch (error) {
    console.error('❌ Build failed');
    process.exit(1);
  }
  
  checkDistDirectory();
  setupTempDirectory();
  setupGitRepo();
  cleanTempDir();
  copyBuildFiles();
  commitAndPush();
  cleanUp();
  
  console.log('✨ Deployment complete!');
  console.log('📋 Your app should be live at https://ysdede.github.io/parakeet.js/');
};

// Run the script
main().catch(error => {
  console.error('❌ Deployment failed');
  console.error(error);
  process.exit(1);
});
