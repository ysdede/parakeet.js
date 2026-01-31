import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration - UPDATE THIS TO YOUR HF SPACE
const HF_SPACE_REPO = 'https://huggingface.co/spaces/ysdede/parakeet.js-demo';
const DIST_DIR = path.join(__dirname, '../dist');
const TEMP_DIR = path.join(__dirname, '../temp_hf_deploy');
const TEMPLATE_DIR = path.join(__dirname, '../space_template');
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

// Create a temporary directory for HF Space repo
const setupTempDirectory = () => {
  console.log('🚀 Setting up temporary directory for Hugging Face Space repository...');
  
  // Remove the temporary directory if it exists
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }
  
  // Create the temporary directory
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  
  console.log('✅ Temporary directory created');
};

// Clone the HF Space repository to the temporary directory
const cloneHfSpaceRepo = () => {
  console.log(`🚀 Cloning Hugging Face Space repository...`);
  
  const cloneResult = runCommand(`git clone ${HF_SPACE_REPO} .`, TEMP_DIR, true);
  
  if (!cloneResult.success) {
    // If clone fails, create a new git repository
    console.log('⚠️ Clone failed, initializing a new git repository');
    runCommand('git init', TEMP_DIR);
    runCommand(`git remote add origin ${HF_SPACE_REPO}`, TEMP_DIR);
    console.log('✅ New repository initialized');
  } else {
    console.log('✅ Repository cloned successfully');
  }
};

// Clean the temporary directory (keep only .git folder)
const cleanTempDir = () => {
  console.log('🧹 Cleaning temporary directory...');
  
  // Get all files and directories in TEMP_DIR
  const items = fs.readdirSync(TEMP_DIR);
  
  // Remove all items except .git
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
    console.error('Error getting git info:', error.message);
    return { branch: 'unknown', commitId: 'unknown' };
  }
};

// Copy build files to temporary directory
const copyBuildFiles = () => {
  console.log('📂 Copying build files to temporary directory...');
  
  // Copy all files from dist to TEMP_DIR
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
  
  // Create git-info.json file
  const gitInfo = getGitInfo();
  fs.writeFileSync(
    path.join(TEMP_DIR, 'git-info.json'),
    JSON.stringify(gitInfo, null, 2)
  );
  console.log(`Created git-info.json with branch: ${gitInfo.branch}, commit: ${gitInfo.commitId}`);
  
  console.log('✅ Build files copied to temporary directory');
};

// Copy template files to temporary directory
const copyTemplateFiles = () => {
  console.log('📂 Copying template files to temporary directory...');
  
  // Copy all files from template to TEMP_DIR
  const templateFiles = fs.readdirSync(TEMPLATE_DIR);
  for (const file of templateFiles) {
    const srcPath = path.join(TEMPLATE_DIR, file);
    const destPath = path.join(TEMP_DIR, file);
    
    if (fs.lstatSync(srcPath).isDirectory()) {
      fs.cpSync(srcPath, destPath, { recursive: true });
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
  
  console.log('✅ Template files copied to temporary directory');
};

// Commit and push changes to HF Space
const commitAndPush = () => {
  console.log('🚀 Checking for changes and pushing to Hugging Face Space...');
  
  // Add all changes to staging
  runCommand('git add .', TEMP_DIR);
  
  // Check if there are any changes to commit
  const statusResult = runCommand('git status --porcelain', TEMP_DIR, true);
  
  // If there are no changes, skip commit and push
  if (!statusResult.output || statusResult.output.trim() === '') {
    console.log('✅ No changes detected. Repository is already up to date.');
    return;
  }
  
  // Get git info
  const gitInfo = getGitInfo();
  
  // There are changes, proceed with commit
  const timestamp = new Date().toISOString();
  console.log('Changes detected, committing...');
  runCommand(`git commit -m "Update demo: ${timestamp} [${gitInfo.branch}:${gitInfo.commitId}]"`, TEMP_DIR);
  
  // Force push to main branch
  console.log('Force pushing to Hugging Face Space repository...');
  const pushResult = runCommand('git push -u origin main --force', TEMP_DIR, true);
  
  if (pushResult.success) {
    console.log('✅ Successfully force pushed to main branch');
  } else {
    // Try pushing to master branch if main fails
    console.log('⚠️ Push to main branch failed, trying master branch...');
    const pushMasterResult = runCommand('git push -u origin master --force', TEMP_DIR, true);
    
    if (pushMasterResult.success) {
      console.log('✅ Successfully force pushed to master branch');
    } else {
      console.error('❌ Failed to push to both main and master branches');
      throw new Error('Failed to push changes to Hugging Face Space repository');
    }
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
  console.log('🚀 Starting deployment to Hugging Face Space...');
  
  // Build the project first
  try {
    runCommand('npm run build', PROJECT_ROOT);
  } catch (error) {
    console.error('❌ Build failed');
    process.exit(1);
  }
  
  checkDistDirectory();
  setupTempDirectory();
  cloneHfSpaceRepo();
  cleanTempDir();
  copyBuildFiles();
  copyTemplateFiles();
  commitAndPush();
  cleanUp();
  
  console.log('✨ Deployment complete!');
  console.log('📋 Your app should be live at https://huggingface.co/spaces/ysdede/parakeet.js-demo');
};

// Run the script
main().catch(error => {
  console.error('❌ Deployment failed');
  console.error(error);
  process.exit(1);
});
