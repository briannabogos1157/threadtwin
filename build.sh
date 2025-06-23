#!/bin/bash
echo "--- Running Root Build Script ---"
# Create a dummy dist directory to satisfy the Vercel build output requirement.
# This allows the build process to continue to the `builds` array in vercel.json.
mkdir -p dist
echo "This is a dummy file." > dist/index.html
echo "--- Dummy 'dist' Directory Created ---" 