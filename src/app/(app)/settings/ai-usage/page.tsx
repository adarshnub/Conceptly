import Link from "next/link";
import {
  ArrowLeft,
  AudioLines,
  Bot,
  CircleAlert,
  Clock3,
  Coins,
  Gauge,
  Hash,
  Info,
  Zap,
} from "lucide-react";
import { getAiUsageDashboard } from "@/lib/ai-usage";
import { requireUser } from "@/lib/session";

const numberFormat = new Intl.NumberFormat("en-US");

function formatCost(microusd: number | null) {
  if (microusd === null) return "Not priced";
  const usd = microusd / 1_000_000;
  if (usd === 0) return "$0.00";
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`;
}

function featureName(feature: "coach" | "class_voice" | "lesson_voice") {
  if (feature === "coach") return "AI coach";
  return feature === "class_voice" ? "Class voice" : "Lesson voice";
}

export default async function AiUsagePage() {
  const session = await requireUser();
  const usage = await getAiUsageDashboard(session.user.id);
  const totalTokens = usage.summary.inputTokens + usage.summary.outputTokens;
  const maxDailyCost = Math.max(1, ...usage.days.map((day) => day.estimatedCostMicrousd));

  return (
    <div className="ai-usage-page">
      <header className="ai-usage-heading">
        <div>
          <Link className="ai-usage-back" href="/settings">
            <ArrowLeft size={16} /> Settings
          </Link>
          <p className="ai-usage-eyebrow"><Gauge size={16} /> AI operations</p>
          <h1>Usage ledger</h1>
          <p>Every AI-assisted explanation and generated class narration for your account.</p>
        </div>
        <div className="ai-estimate-badge"><Info size={15} /> Cost estimates</div>
      </header>

      <section className="ai-cost-hero" aria-label="Estimated AI cost">
        <div>
          <span>Estimated spend · all time</span>
          <strong>{formatCost(usage.summary.estimatedCostMicrousd)}</strong>
          <p>
            {usage.summary.unpricedRequests
              ? `${usage.summary.unpricedRequests} successful request${usage.summary.unpricedRequests === 1 ? " has" : "s have"} an unknown model price and are excluded.`
              : "All successful requests use a recognized pricing estimate."}
          </p>
        </div>
        <div className="ai-cost-orbit" aria-hidden="true">
          <Coins size={34} />
          <span /><span />
        </div>
      </section>

      <section className="ai-stat-grid" aria-label="AI usage totals">
        <UsageStat icon={<Zap size={20} />} label="API requests" value={numberFormat.format(usage.summary.requests)} detail={`${usage.summary.succeeded} completed`} />
        <UsageStat icon={<Hash size={20} />} label="Text tokens" value={numberFormat.format(totalTokens)} detail={`${numberFormat.format(usage.summary.cachedInputTokens)} cached input`} />
        <UsageStat icon={<AudioLines size={20} />} label="Generated voice" value={formatDuration(usage.summary.audioSeconds)} detail={`${numberFormat.format(usage.summary.inputCharacters)} input characters`} />
        <UsageStat icon={<CircleAlert size={20} />} label="Fallbacks" value={numberFormat.format(usage.summary.failed + usage.summary.skipped)} detail={`${usage.summary.failed} failed · ${usage.summary.skipped} skipped`} />
      </section>

      <div className="ai-usage-grid">
        <section className="ai-usage-panel ai-trend-panel">
          <div className="ai-panel-heading">
            <div><span>Last 14 days</span><h2>Daily estimated spend</h2></div>
            <Clock3 size={20} />
          </div>
          <div className="ai-cost-chart" aria-label="Estimated spend for each of the last fourteen days">
            {usage.days.map((day) => (
              <div className="ai-chart-day" key={day.day} title={`${day.day}: ${formatCost(day.estimatedCostMicrousd)}, ${day.requests} requests`}>
                <span className="ai-chart-value">{day.estimatedCostMicrousd ? formatCost(day.estimatedCostMicrousd) : ""}</span>
                <div className="ai-chart-track">
                  <span style={{ height: `${Math.max(day.estimatedCostMicrousd ? 8 : 2, (day.estimatedCostMicrousd / maxDailyCost) * 100)}%` }} />
                </div>
                <small>{new Date(`${day.day}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="ai-usage-panel ai-feature-panel">
          <div className="ai-panel-heading"><div><span>By feature</span><h2>Where usage happens</h2></div><Bot size={20} /></div>
          <div className="ai-feature-list">
            {(["coach", "class_voice", "lesson_voice"] as const).map((feature) => {
              const row = usage.features.find((item) => item.feature === feature);
              return (
                <article key={feature}>
                  <div className={`ai-feature-icon ai-feature-${feature}`}>
                    {feature === "coach" ? <Bot size={20} /> : <AudioLines size={20} />}
                  </div>
                  <div>
                    <strong>{featureName(feature)}</strong>
                    <span>{row?.requests ?? 0} requests · {feature === "coach" ? `${numberFormat.format(row?.tokens ?? 0)} tokens` : formatDuration(row?.audioSeconds ?? 0)}</span>
                  </div>
                  <strong>{formatCost(row?.estimatedCostMicrousd ?? 0)}</strong>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      <section className="ai-usage-panel ai-recent-panel">
        <div className="ai-panel-heading">
          <div><span>Audit trail</span><h2>Recent AI requests</h2></div>
          <span className="ai-row-count">Last {usage.recent.length}</span>
        </div>
        {usage.recent.length ? (
          <div className="ai-usage-table-wrap">
            <table className="ai-usage-table">
              <thead><tr><th>Feature</th><th>Model</th><th>Usage</th><th>Status</th><th>Estimate</th><th>When</th></tr></thead>
              <tbody>
                {usage.recent.map((event) => (
                  <tr key={event.id}>
                    <td><span className="ai-table-feature">{event.feature === "coach" ? <Bot size={16} /> : <AudioLines size={16} />}{featureName(event.feature)}</span></td>
                    <td><code>{event.model}</code></td>
                    <td>{event.feature === "coach" ? `${numberFormat.format(event.inputTokens + event.outputTokens)} tokens` : formatDuration(event.audioSeconds)}</td>
                    <td><span className={`ai-status ai-status-${event.status}`}>{event.status}</span></td>
                    <td>{formatCost(event.estimatedCostMicrousd)}</td>
                    <td title={event.createdAt}>{new Date(event.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="ai-empty-ledger"><Gauge size={28} /><strong>No AI requests recorded yet</strong><p>Use the class voice or trigger the learning coach and the request will appear here.</p></div>
        )}
      </section>

      <aside className="ai-pricing-note">
        <Info size={18} />
        <p><strong>About these numbers.</strong> Text tokens come directly from OpenAI response usage. Voice duration and cost are estimates based on narration length and the configured per-minute rate. Your OpenAI billing dashboard remains the final source of truth.</p>
      </aside>
    </div>
  );
}

function UsageStat({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return (
    <article className="ai-stat-card">
      <div className="ai-stat-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}
