# Agent Posting Rules

## GitHub Text Formatting

Use these rules for all GitHub write actions:
- `gh pr comment`
- `gh pr edit --body`
- `gh issue comment`
- review replies/comments

1. Never post literal escaped newline sequences (`\n`) in final text.
2. Prefer `--body-file <path>` with a Markdown file containing real line breaks.
3. If using `--body`, ensure it contains actual newlines, not escaped `\n`.
4. Verify content before posting:
   - no `\n` artifacts,
   - no truncated lines,
   - markdown bullets/headings/code blocks render cleanly.
5. Keep content concise and scannable:
   - short sections,
   - simple bullets,
   - wrap commands, paths, and commit hashes in backticks.
