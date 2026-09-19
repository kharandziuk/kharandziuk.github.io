---
name: scope
description: >-
  Scopes an arbitrary task before implementation: reviews AGENTS.md, defines
  work boundaries, and explicitly names the tools it will use for validation and
  implementation. Can be composed with /questions. Use when the user runs /scope 
  or asks to scope, define scope, or agree on scope before starting work. 
  Do not write code or execute the task until scope is agreed.
disable-model-invocation: true
---

# Scope

When the user triggers `/scope`, treat the preceding text as an arbitrary task and execute the following instructions exactly:

1. **Context Check**: Review the `AGENTS.md` file in the workspace context to ensure alignment with agent guidelines.
2. **Task Review**: Analyze the task provided in the prompt.
3. **Scope Definition**: Clearly state your understanding of the scope of work based on the task. Inside this description, you must explicitly name the tools you are going to use for validation and implementation. (Strict limit: maximum 150 words total for this section).

Structure your output clearly with a "### Scope" header. Do not generate any code or begin the task until the scope is agreed upon.

## Workflow

1. Read `AGENTS.md` in the workspace root.
2. Parse the task from the user message.
3. Respond with the section below—no code, no implementation, no file edits.
4. *Composability*: If the user also triggered `/questions`, execute the workflow for `/questions` and append its output section below the Scope section.

## Output format

### Scope

[Scope definition, including the tools you will use for validation and implementation. Max 150 words.]

## Constraints

- **Scope section**: ≤200 words total.
- Stop after output. Wait for user confirmation before any implementation.
