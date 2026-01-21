# Quick Start Guide

## Try it on your codebase (no installation)

```bash
npx @mathonsunday/useless-test-detector
```

## Use it in CI/CD

Add to your `package.json`:

```json
{
  "scripts": {
    "test:quality": "useless-tests --min-confidence high"
  },
  "devDependencies": {
    "@mathonsunday/useless-test-detector": "^0.1.0"
  }
}
```

Then in your CI:

```yaml
# .github/workflows/test.yml
- name: Check test quality
  run: npm run test:quality
```

## Workflow for cleaning up a codebase

1. **Run the detector with high confidence:**
   ```bash
   npx @mathonsunday/useless-test-detector --min-confidence high
   ```

2. **Review flagged files manually:**
   - Open each high-confidence file
   - Ask: "Does this import and test the actual implementation?"
   - Delete if it only tests mocks or built-ins

3. **Run with medium confidence:**
   ```bash
   npx @mathonsunday/useless-test-detector --min-confidence medium
   ```

4. **For each medium confidence file:**
   - More likely to be false positives
   - Review the specific reasons given
   - Keep tests that exercise real code paths

5. **Verify tests still pass:**
   ```bash
   npm test
   ```

## Example: Real cleanup session

From the `agentic-ui-lab` codebase cleanup:

```bash
# Before
$ npm test
Test Files  37 passed (37)
Tests       829 passed (829)

# Run detector
$ npx @mathonsunday/useless-test-detector --min-confidence high

🔴 api/__tests__/analyze-user-stream.integration.test.ts
   Confidence: HIGH | Lines: 733
   Reasons:
     - Defines 2 inline implementation(s) instead of importing real ones
     - Creates 15 mock objects and asserts on hardcoded values
     - No imports from actual implementation

# After deleting 6 useless files
$ npm test
Test Files  31 passed (31)
Tests       733 passed (733)  # Lost 96 useless tests
```

**Result:** 16% of test suite was providing zero value.

## Publishing (for maintainers)

1. Update version in `package.json`
2. Build: `npm run build`
3. Publish: `npm publish --access public`

## Local development

```bash
# Clone and build
git clone https://github.com/mathonsunday/useless-test-detector
cd useless-test-detector
npm install
npm run build

# Test on a project
node dist/cli.js --dirs /path/to/project/src
```
