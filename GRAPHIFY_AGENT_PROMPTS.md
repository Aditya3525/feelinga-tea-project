# Graphify Agent Quickstart Prompts

Use this file as the standard starting point for Graphify-powered work in this repository.

## 1) One-Command Graph Refresh

From repository root:

./scripts/graphify-refresh.ps1

If running from Command Prompt:

scripts/graphify-refresh.cmd

## 2) Initial Copilot Chat Command

In VS Code Copilot Chat:

/graphify .

## 3) Initial Prompt for Copilot Agent

Paste this as your first instruction to Copilot Agent:

You have access to a Graphify knowledge graph at graphify-out.
For every question:
1. First run: graphify query "<user question>" --graph graphify-out/graph.json
2. Use only the returned graph context to answer.
3. If graph context is insufficient, read only specific files.
Rules:
- Do not scan the whole codebase.
- Prefer relationships, dependencies, and paths from the graph.
- Cite source files from graph output when possible.

## 4) Recommended First Analysis Prompt

Analyze auth flow end-to-end. Start with:
graphify query "show auth flow end-to-end in this repo" --graph graphify-out/graph.json

Then return:
- entry points
- middleware chain
- controllers and services touched
- frontend calls to backend auth routes
- likely weak points or missing checks

## 5) Additional Starter Prompts

A) Checkout and orders:

graphify query "show checkout to order creation flow" --graph graphify-out/graph.json

B) Admin impact map:

graphify query "show admin routes and connected models" --graph graphify-out/graph.json

C) Frontend to backend API map:

graphify query "map frontend apiRequest usage to backend modules" --graph graphify-out/graph.json

## 6) Expected Output Artifacts

After refresh, verify these exist:
- graphify-out/graph.json
- graphify-out/graph.html
- graphify-out/GRAPH_REPORT.md
