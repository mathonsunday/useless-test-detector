/**
 * Useless Test Detector
 *
 * Detects test files that don't actually test real implementations.
 * Based on patterns found in real-world test cleanup.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

export interface SuspiciousTest {
  file: string;
  reasons: string[];
  confidence: 'high' | 'medium' | 'low';
  lineCount: number;
}

export interface DetectorOptions {
  /** Directories to scan (default: ['src', 'api']) */
  directories?: string[];
  /** Minimum confidence level to report (default: 'low') */
  minConfidence?: 'high' | 'medium' | 'low';
  /** Custom test file patterns (default: [/\.(test|spec)\.(ts|tsx|js|jsx)$/]) */
  testPatterns?: RegExp[];
}

const DEFAULT_TEST_PATTERNS = [
  /\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$/,
];

/**
 * Find all test files in a directory recursively
 */
export function findTestFiles(
  dir: string,
  patterns: RegExp[] = DEFAULT_TEST_PATTERNS
): string[] {
  const files: string[] = [];

  try {
    const items = readdirSync(dir);

    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('dist')) {
        files.push(...findTestFiles(fullPath, patterns));
      } else if (patterns.some(pattern => pattern.test(item))) {
        files.push(fullPath);
      }
    }
  } catch (err) {
    // Directory doesn't exist or can't be read
  }

  return files;
}

/**
 * Analyze a single test file for suspicious patterns
 */
export function analyzeTestFile(filePath: string): SuspiciousTest | null {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const reasons: string[] = [];

  // Anti-pattern 1: Defines inline implementations
  // Look for function/class/const definitions that look like implementations
  const inlineImplementations = content.match(
    /^\s*(function|class|const)\s+\w+(Buffer|Parser|Handler|Helper|Manager|Service|Client|Builder|Strategy)/gm
  );
  if (inlineImplementations && inlineImplementations.length > 0) {
    reasons.push(
      `Defines ${inlineImplementations.length} inline implementation(s) instead of importing real ones`
    );
  }

  // Anti-pattern 2: Tests TypeScript types only (no runtime assertions)
  const hasTypeImports = content.match(/import type|interface \w+|type \w+ =/);
  const hasRuntimeTests = content.match(/render\(|renderHook\(|new \w+\(|\.toHaveBeenCalled/);
  if (hasTypeImports && !hasRuntimeTests) {
    reasons.push('Appears to test TypeScript types, not runtime behavior');
  }

  // Anti-pattern 3: Creates mocks and only asserts on hardcoded values
  const mockAssertions = content.match(/const \w+:\s*\w+\s*=\s*\{[^}]+\};\s+expect\(\w+\.\w+\)/g);
  if (mockAssertions && mockAssertions.length > 3) {
    reasons.push(
      `Creates ${mockAssertions.length} mock objects and asserts on hardcoded values`
    );
  }

  // Anti-pattern 4: No imports from actual source code
  const hasSourceImports = content.match(/from ['"]\.\.+(\/[^'"]*)?(?<!\.test)(?<!\.spec)['"]/);
  const hasTestingLibImports = content.includes('@testing-library');
  const isIntegrationTest = /[/\\](integration|e2e)\.test\.(ts|tsx|js|jsx|mjs|cjs)$/.test(filePath);

  // Only flag if there are testing library imports but NO source imports at all
  if (hasTestingLibImports && !hasSourceImports && !isIntegrationTest) {
    reasons.push('No imports from actual implementation (only test utilities)');
  }

  // Anti-pattern 5: Admits it's not a real test
  if (content.includes('In a real test') || content.includes('would be actual')) {
    reasons.push('Contains comments admitting these aren\'t real tests');
  }

  // Anti-pattern 6: Only tests built-in JavaScript/TypeScript features
  const testsBuiltins = content.match(/expect\(typeof|expect\(.*\)\.toBe\(['"](?:string|number|boolean)/g);
  const totalExpects = content.match(/expect\(/g)?.length || 0;
  if (testsBuiltins && totalExpects > 0 && testsBuiltins.length / totalExpects > 0.5) {
    reasons.push('More than 50% of assertions test JavaScript built-ins (typeof, etc)');
  }

  // Anti-pattern 7: Integration tests that never make actual HTTP requests
  if (isIntegrationTest) {
    const hasFetch = content.match(/fetch\(|request\(|axios\.|supertest/);
    const hasRender = content.match(/render\(/);
    if (!hasFetch && !hasRender) {
      reasons.push('Integration test that never makes HTTP requests or renders components');
    }
  }

  if (reasons.length === 0) return null;

  // Calculate confidence based on number of red flags
  const confidence: 'high' | 'medium' | 'low' =
    reasons.length >= 3 ? 'high' :
    reasons.length >= 2 ? 'medium' : 'low';

  return {
    file: filePath,
    reasons,
    confidence,
    lineCount: lines.length,
  };
}

/**
 * Scan directories for useless tests
 */
export function detectUselessTests(options: DetectorOptions = {}): SuspiciousTest[] {
  const {
    directories = ['src', 'api'],
    minConfidence = 'low',
    testPatterns = DEFAULT_TEST_PATTERNS,
  } = options;

  const allTestFiles: string[] = [];
  for (const dir of directories) {
    allTestFiles.push(...findTestFiles(dir, testPatterns));
  }

  const suspicious = allTestFiles
    .map(analyzeTestFile)
    .filter((result): result is SuspiciousTest => result !== null);

  // Filter by confidence level
  const confidenceLevels = { high: 3, medium: 2, low: 1 };
  const minLevel = confidenceLevels[minConfidence];

  return suspicious
    .filter(test => confidenceLevels[test.confidence] >= minLevel)
    .sort((a, b) => {
      // Sort by confidence (high first), then by line count (larger first)
      const confidenceDiff = confidenceLevels[b.confidence] - confidenceLevels[a.confidence];
      if (confidenceDiff !== 0) return confidenceDiff;
      return b.lineCount - a.lineCount;
    });
}
