# Pull Request Rules

## GitHub Text Formatting

Apply these rules for all GitHub write actions:
- `gh pr create`
- `gh pr edit --body`
- `gh pr comment`
- `gh issue comment`
- review replies/comments

1. Never post literal escaped newline sequences (`\n`) in final text.
2. Prefer `--body-file <path>` with Markdown that contains real line breaks.
3. If using `--body`, ensure it contains actual newlines, not escaped `\n`.
4. Verify content before posting:
   - no `\n` artifacts,
   - no truncated lines,
   - markdown bullets/headings/code blocks render cleanly.
5. Keep content concise and scannable:
   - short sections,
   - simple bullets,
   - wrap commands, paths, and commit hashes in backticks.
