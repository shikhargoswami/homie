#!/usr/bin/env node

/**
 * Verify all required dependencies are installed
 */

const fs = require('fs');
const path = require('path');

const requiredDeps = {
  dependencies: [
    'expo',
    'react',
    'react-native',
    '@react-navigation/native',
    '@react-navigation/native-stack',
    '@react-navigation/bottom-tabs',
    'react-native-screens',
    'react-native-safe-area-context',
    '@tanstack/react-query',
    'axios',
    '@react-native-async-storage/async-storage',
    'react-native-gesture-handler',
    'react-native-reanimated',
    'react-native-deck-swiper',
    '@expo/vector-icons',
    'posthog-react-native',
  ],
  devDependencies: [
    '@types/react',
    '@types/react-native',
    'typescript',
  ],
};

const packageJsonPath = path.join(process.cwd(), 'package.json');

if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ package.json not found');
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

console.log('🔍 Checking dependencies...\n');

let missingDeps = [];

// Check dependencies
requiredDeps.dependencies.forEach((dep) => {
  if (!packageJson.dependencies || !packageJson.dependencies[dep]) {
    console.log(`❌ Missing: ${dep}`);
    missingDeps.push(dep);
  } else {
    console.log(`✅ Found: ${dep}`);
  }
});

// Check devDependencies
requiredDeps.devDependencies.forEach((dep) => {
  if (!packageJson.devDependencies || !packageJson.devDependencies[dep]) {
    console.log(`⚠️  Missing (dev): ${dep}`);
  } else {
    console.log(`✅ Found (dev): ${dep}`);
  }
});

if (missingDeps.length > 0) {
  console.log('\n📦 Install missing dependencies:\n');
  console.log(`npm install ${missingDeps.join(' ')}`);
  process.exit(1);
} else {
  console.log('\n✅ All required dependencies are installed!');
}
