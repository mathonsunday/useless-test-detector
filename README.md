# Useless Test Detector

Detects test files that don't actually test real implementations.

Based on real-world experience cleaning up test suites where tests create mock objects, assert on hardcoded values, or test JavaScript/TypeScript built-ins instead of actual application logic.

## Installation

```bash
npm install --save-dev @mathonsunday/useless-test-detector
```

Or run directly with npx:

```bash
npx @mathonsunday/useless-test-detector
```

## Usage

### CLI

```bash
# Scan default directories (src, api)
useless-tests

# Scan custom directories
useless-tests --dirs src,tests,lib

# Only show high confidence results
useless-tests --min-confidence high

# Output as JSON
useless-tests --json > report.json
```

### Programmatic API

```typescript
import { detectUselessTests } from '@mathonsunday/useless-test-detector';

const results = detectUselessTests({
  directories: ['src', 'api'],
  minConfidence: 'medium',
});

for (const test of results) {
  console.log(test.file, test.confidence, test.reasons);
}
```

## What It Detects

The tool looks for these anti-patterns:

1. **Inline implementations**: Tests that define their own `EventBuffer`, `Parser`, etc. instead of importing the real one
2. **Type-only tests**: Tests that only verify TypeScript types, not runtime behavior
3. **Mock-only tests**: Tests that create mock objects and assert on hardcoded values
4. **No source imports**: Tests that don't import anything from the actual codebase
5. **Admission comments**: Tests with comments like "In a real test, this would..."
6. **Built-in testing**: Tests that only verify JavaScript's `typeof` or other built-ins
7. **Fake integration tests**: "Integration" tests that never make HTTP requests

## Example Output

```
🔍 Found 3 suspicious test file(s):

🔴 src/__tests__/events.fixed.test.ts
   Confidence: HIGH | Lines: 407
   Reasons:
     - Defines 3 inline implementation(s) instead of importing real ones
     - Creates 12 mock objects and asserts on hardcoded values
     - No imports from actual implementation (only test utilities)

🟡 api/__tests__/types.test.ts
   Confidence: MEDIUM | Lines: 121
   Reasons:
     - Appears to test TypeScript types, not runtime behavior
     - More than 50% of assertions test JavaScript built-ins (typeof, etc)

💡 Recommendation:
   Review these files manually. High confidence files are likely useless.
   Delete files that don't import and test actual implementations.
```

## Philosophy

Not all "bad" tests are useless, but tests that don't exercise real code paths provide zero value and create false confidence.

This tool flags obvious cases where tests:
- Don't import the code they claim to test
- Only test TypeScript's type system (which already runs at compile time)
- Create inline mocks that duplicate production logic

## License

MIT
