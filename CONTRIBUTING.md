# Contributing to Useless Test Detector

Thanks for your interest in improving test quality tooling!

## Development Setup

```bash
git clone https://github.com/mathonsunday/useless-test-detector
cd useless-test-detector
npm install
npm run build
```

## Testing Locally

Test the detector on a project:

```bash
node dist/cli.js --dirs /path/to/project/src
```

## Adding New Anti-Patterns

Found a new pattern of useless tests? Add it to `src/index.ts`:

1. Add detection logic in `analyzeTestFile()`
2. Add a descriptive reason string
3. Test it on real codebases
4. Update README with the new pattern

## Pull Request Guidelines

- Keep changes focused (one pattern per PR)
- Test on at least 2 real codebases
- Update README if adding new detection
- No false positives allowed

## Release Process

1. Update version in `package.json`
2. Commit: `git commit -m "chore: bump version to X.Y.Z"`
3. Create GitHub release
4. GitHub Actions will auto-publish to npm

## Questions?

Open an issue or discussion on GitHub.
