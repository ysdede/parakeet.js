# publish.ps1

# This script automates the process of versioning and publishing the Parakeet.js package to npm.
# It ensures your git repository is clean, bumps the version, pushes to git, and publishes to npm.
#
# This version is more robust and will not fail if the version is already set correctly.
#
# Usage:
#   .\publish.ps1 <new-version>
#
# Example (to bump to version 0.0.3):
#   .\publish.ps1 0.0.3

param(
    [Parameter(Mandatory=$true)]
    [string]$NewVersion
)

# --- 1. Pre-flight checks ---

$ErrorActionPreference = "Stop" # Exit script on any error

# Check if git working directory is clean
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "FAIL: Git working directory is not clean. Please commit or stash your changes before publishing." -ForegroundColor Red
    exit 1
}
Write-Host "OK: Git directory is clean."

# Check if logged into npm
$npmWhoami = npm whoami
Write-Host "OK: Logged into npm as '$npmWhoami'."


# --- 2. Versioning and Publishing ---

Write-Host "Starting publish process for version $NewVersion..." -ForegroundColor Green

try {
    # Step 1: Bump version. If it's already set, that's okay.
    Write-Host "   - Setting version to $NewVersion..."
    $currentVersion = (Get-Content -Path ./package.json | ConvertFrom-Json).version
    if ($currentVersion -ne $NewVersion) {
        npm version $NewVersion
    } else {
        Write-Host "   - Version is already $NewVersion. Skipping version bump." -ForegroundColor Yellow
    }

    # Step 2: Push the new commit and tag to the remote repository
    Write-Host "   - Pushing commit and tags to remote..."
    git push && git push --tags

    # Step 3: Publish the package to npm
    Write-Host "   - Publishing to npm..."
    npm publish

    Write-Host ""
    Write-Host "PASS: Successfully published parakeet.js version $NewVersion!" -ForegroundColor Green
}
catch {
    Write-Host "FAIL: An error occurred during the publish process: $_" -ForegroundColor Red
    Write-Host "   Publish process aborted. Please check the state of your repository and npm." -ForegroundColor Yellow
    exit 1
} 