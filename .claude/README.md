# Claude Code Learning System - Quick Reference

## 📁 File Structure

**`.claude/context.md`** - Project essentials: tech stack, commands, structure, conventions
- Use: When starting work or onboarding new context

**`.claude/rules.md`** - Development rules and patterns specific to this project
- Use: Before making changes, reference for testing/category patterns

**`.claude/learnings.md`** - Session log of patterns, issues, and solutions discovered
- Use: Reference past solutions, track project evolution

## ⚡ Quick Start Commands

```bash
# Before every session
cc 'Check .claude/ files. Then: [YOUR TASK]'

# After every session
cclog '[one-line summary]'

# Check recent learnings
tail -20 .claude/learnings.md

# View rules
cat .claude/rules.md

# View project context
cat .claude/context.md
```

## 🔄 Workflow

1. **Session Start**: Read context.md + rules.md
2. **During Work**: Follow rules, document new patterns
3. **Session End**: Update learnings.md with discoveries
4. **Next Session**: Check learnings.md for relevant past solutions

## 📝 Learnings Format

```markdown
## Session Log
2024-10-10: Fixed CategoryProducts to use same category resolution as CategoryBreadcrumb
2024-10-10: [your session summary]
```

Keep entries one-line, focus on patterns and solutions that would help future work.