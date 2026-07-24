import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listClientsTool from "./tools/list-clients";
import getClientTool from "./tools/get-client";
import whoamiTool from "./tools/whoami";

const projectRef =
  import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "ideal-mcp",
  title: "IDEAL",
  version: "0.1.0",
  instructions:
    "Read-only tools for the IDEAL clinical monitoring app. Use `list_clients` to find a client id, then `get_client` for details. All access is scoped to the signed-in user via RLS.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [whoamiTool, listClientsTool, getClientTool],
});
