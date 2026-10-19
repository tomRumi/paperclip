import type { PluginContext, PluginPerformActionContext, ToolRunContext } from "@paperclipai/plugin-sdk";

type ActionHandler = (params: Record<string, unknown>, context: PluginPerformActionContext) => Promise<unknown>;

function trimmedString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function assertBoardActionCaller(params: Record<string, unknown>, context: PluginPerformActionContext) {
  if (context.actor.type !== "user") {
    throw new Error("LLM Wiki actions can only be called by board users");
  }
  const authorizedCompanyId = trimmedString(context.companyId) ?? trimmedString(context.actor.companyId);
  const requestedCompanyId = trimmedString(params.companyId);
  if (authorizedCompanyId && requestedCompanyId && authorizedCompanyId !== requestedCompanyId) {
    throw new Error("companyId does not match the company authorized for this action");
  }
}

export function registerBoardAction(ctx: PluginContext, key: string, handler: ActionHandler) {
  ctx.actions.register(key, async (params, context) => {
    assertBoardActionCaller(params, context);
    return handler(params, context);
  });
}

export function resolveToolCompanyId(params: Record<string, unknown>, runCtx: ToolRunContext): string {
  const runCompanyId = trimmedString(runCtx?.companyId);
  if (!runCompanyId) {
    throw new Error("Tool run context has no company");
  }
  const requestedCompanyId = trimmedString(params.companyId);
  if (requestedCompanyId && requestedCompanyId !== runCompanyId) {
    throw new Error("companyId does not match the company of the calling run");
  }
  return runCompanyId;
}
