## Summary
- What changed:
- Why this change is needed:

## Scope Guard
- [ ] This PR is scoped to one concern (no unrelated cleanup/churn).
- [ ] I did not change fragile logic without targeted tests.

## Fragile Areas Touched
- [ ] Transducer/TDT decode loop (`src/parakeet.js`)
- [ ] Incremental decoder cache (`cacheKey`/`prefixSeconds`)
- [ ] Incremental mel caching / overlap (`src/mel.js`)
- [ ] ORT tensor lifecycle/disposal (`src/parakeet.js`, `src/preprocessor.js`)
- [ ] None of the above

## Verification
- [ ] `npm test`
- [ ] Added/updated targeted tests for touched fragile areas
- [ ] Verified no obvious memory growth risk in changed code paths
- [ ] Verified no regression in streaming behavior for overlap/prefix reuse

### Test Evidence
Paste command output snippets here (or link CI runs):

## Risk and Rollback
- Risk level: `low` / `medium` / `high`
- Rollback plan (single commit/PR to revert if needed):

## Related Issues
- Closes/Fixes:
- Follow-ups (if any):
