#!/usr/bin/env node
/**
 * CLI for Useless Test Detector
 */

import { detectUselessTests } from './index.js';

const args = process.argv.slice(2);

// Parse arguments
let directories = ['src', 'api'];
let minConfidence: 'high' | 'medium' | 'low' = 'low';
let jsonOutput = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--dirs' && args[i + 1]) {
    directories = args[i + 1].split(',');
    i++;
  } else if (args[i] === '--min-confidence' && args[i + 1]) {
    minConfidence = args[i + 1] as 'high' | 'medium' | 'low';
    i++;
  } else if (args[i] === '--json') {
    jsonOutput = true;
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
Useless Test Detector
Finds test files that don't actually test real implementations.

Usage:
  useless-tests [options]

Options:
  --dirs <dirs>              Comma-separated directories to scan (default: src,api)
  --min-confidence <level>   Minimum confidence level: high, medium, low (default: low)
  --json                     Output results as JSON
  --help, -h                 Show this help message

Examples:
  useless-tests
  useless-tests --dirs src,tests --min-confidence high
  useless-tests --json > report.json

Exit codes:
  0 - No suspicious tests found
  1 - Suspicious tests found (check output)
`);
    process.exit(0);
  }
}

// Run detection
const results = detectUselessTests({ directories, minConfidence });

// Output results
if (jsonOutput) {
  console.log(JSON.stringify(results, null, 2));
} else {
  if (results.length === 0) {
    console.log('✅ No obviously useless tests detected!');
    process.exit(0);
  }

  console.log(`🔍 Found ${results.length} suspicious test file(s):\n`);

  for (const test of results) {
    const icon = test.confidence === 'high' ? '🔴' :
                 test.confidence === 'medium' ? '🟡' : '🟢';

    console.log(`${icon} ${test.file}`);
    console.log(`   Confidence: ${test.confidence.toUpperCase()} | Lines: ${test.lineCount}`);
    console.log(`   Reasons:`);
    for (const reason of test.reasons) {
      console.log(`     - ${reason}`);
    }
    console.log('');
  }

  console.log(`\n💡 Recommendation:`);
  console.log(`   Review these files manually. High confidence files are likely useless.`);
  console.log(`   Delete files that don't import and test actual implementations.\n`);
}

process.exit(results.length > 0 ? 1 : 0);
