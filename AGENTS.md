<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:mcp-check-rule -->
# Always check MCP before implementing

Before implementing any feature that may involve an external service (e.g., Supabase, Vercel, database/schema changes, deployments), always check the available MCP servers and tools first. Use `mcp_list_servers` and `mcp_list_tools` to discover the right tool, then use it instead of guessing, running CLI commands blindly, or making destructive changes manually.
<!-- END:mcp-check-rule -->
