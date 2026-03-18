// Private runtime barrel for the bundled Zalo extension.
// Keep this curated to the symbols used by production code under extensions/zalo/src.
// Imports directly from ../../src/ to avoid the circular dependency through openclaw/plugin-sdk/zalo.

export { jsonResult, readStringParam } from "../../src/agents/tools/common.js";
export { listDirectoryUserEntriesFromAllowFrom } from "../../src/channels/plugins/directory-config-helpers.js";
export { buildChannelConfigSchema } from "../../src/channels/plugins/config-schema.js";
export { logTypingFailure } from "../../src/channels/logging.js";
export { PAIRING_APPROVED_MESSAGE } from "../../src/channels/plugins/pairing-message.js";
export { createAccountListHelpers } from "../../src/channels/plugins/account-helpers.js";
export type {
  BaseProbeResult,
  BaseTokenResolution,
  ChannelAccountSnapshot,
  ChannelMessageActionAdapter,
  ChannelMessageActionName,
  ChannelStatusIssue,
} from "../../src/channels/plugins/types.js";
export type { ChannelPlugin } from "../../src/channels/plugins/types.plugin.js";
export { createReplyPrefixOptions } from "../../src/channels/reply-prefix.js";
export { createTypingCallbacks } from "../../src/channels/typing.js";
export type { OpenClawConfig } from "../../src/config/config.js";
export {
  resolveDefaultGroupPolicy,
  resolveOpenProviderRuntimeGroupPolicy,
  warnMissingProviderGroupPolicyFallbackOnce,
} from "../../src/config/runtime-group-policy.js";
export type { GroupPolicy, MarkdownTableMode } from "../../src/config/types.js";
export type { SecretInput } from "../../src/config/types.secrets.js";
export {
  hasConfiguredSecretInput,
  normalizeResolvedSecretInputString,
  normalizeSecretInputString,
} from "../../src/config/types.secrets.js";
export { buildSecretInputSchema } from "../../src/plugin-sdk/secret-input-schema.js";
export { MarkdownConfigSchema } from "../../src/config/zod-schema.core.js";
export { waitForAbortSignal } from "../../src/infra/abort-signal.js";
export { createDedupeCache } from "../../src/infra/dedupe.js";
export { resolveClientIp } from "../../src/gateway/net.js";
export type { PluginRuntime } from "../../src/plugins/runtime/types.js";
export { DEFAULT_ACCOUNT_ID } from "../../src/routing/session-key.js";
export {
  formatAllowFromLowercase,
  isNormalizedSenderAllowed,
} from "../../src/plugin-sdk/allow-from.js";
export {
  resolveDirectDmAuthorizationOutcome,
  resolveSenderCommandAuthorizationWithRuntime,
} from "../../src/plugin-sdk/command-auth.js";
export { evaluateSenderGroupAccess } from "../../src/plugin-sdk/group-access.js";
export type { SenderGroupAccessDecision } from "../../src/plugin-sdk/group-access.js";
export { resolveInboundRouteEnvelopeBuilderWithRuntime } from "../../src/plugin-sdk/inbound-envelope.js";
export { createScopedPairingAccess } from "../../src/plugin-sdk/pairing-access.js";
export { issuePairingChallenge } from "../../src/pairing/pairing-challenge.js";
export { buildChannelSendResult } from "../../src/plugin-sdk/channel-send-result.js";
export type { OutboundReplyPayload } from "../../src/plugin-sdk/reply-payload.js";
export {
  isNumericTargetId,
  resolveOutboundMediaUrls,
  sendMediaWithLeadingCaption,
  sendPayloadWithChunkedTextAndMedia,
} from "../../src/plugin-sdk/reply-payload.js";
export {
  buildBaseAccountStatusSnapshot,
  buildTokenChannelStatusSummary,
} from "../../src/plugin-sdk/status-helpers.js";
export { chunkTextForOutbound } from "../../src/plugin-sdk/text-chunking.js";
export { extractToolSend } from "../../src/plugin-sdk/tool-send.js";
export {
  createFixedWindowRateLimiter,
  createWebhookAnomalyTracker,
  WEBHOOK_ANOMALY_COUNTER_DEFAULTS,
  WEBHOOK_RATE_LIMIT_DEFAULTS,
} from "../../src/plugin-sdk/webhook-memory-guards.js";
export { resolveWebhookPath } from "../../src/plugin-sdk/webhook-path.js";
export {
  applyBasicWebhookRequestGuards,
  readJsonWebhookBodyOrReject,
} from "../../src/plugin-sdk/webhook-request-guards.js";
export type {
  RegisterWebhookPluginRouteOptions,
  RegisterWebhookTargetOptions,
} from "../../src/plugin-sdk/webhook-targets.js";
export {
  registerWebhookTarget,
  registerWebhookTargetWithPluginRoute,
  resolveWebhookTargetWithAuthOrRejectSync,
  withResolvedWebhookRequestPipeline,
} from "../../src/plugin-sdk/webhook-targets.js";
