'use client';

import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import type { GenerationStatusReport, SectionKey, SectionStatusEntry } from '@/lib/generationStatus';
import { SECTION_META } from '@/lib/generationStatus';
import { isQuotaCooldownActive } from '@/lib/generationStatus';

interface GenerationStatusPanelProps {
  report: GenerationStatusReport;
  onRegenerateSection?: (key: SectionKey, regenerateType: string) => void;
  regeneratingKey?: SectionKey | null;
  compact?: boolean;
  onUpgrade?: () => void;
}

function StatusIcon({ status }: { status: SectionStatusEntry['status'] }) {
  if (status === 'complete') return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
  if (status === 'quota_exceeded') return <Clock className="w-4 h-4 text-amber-500 shrink-0" />;
  if (status === 'failed') return <XCircle className="w-4 h-4 text-red-500 shrink-0" />;
  if (status === 'skipped') return <span className="w-4 h-4 shrink-0" />;
  return <AlertTriangle className="w-4 h-4 text-muted-foreground shrink-0" />;
}

function statusLabel(status: SectionStatusEntry['status']): string {
  switch (status) {
    case 'complete': return 'Ready';
    case 'quota_exceeded': return 'Credits exhausted';
    case 'failed': return 'Failed';
    case 'missing': return 'Not generated';
    case 'skipped': return 'Not requested';
    default: return status;
  }
}

export default function GenerationStatusPanel({
  report,
  onRegenerateSection,
  regeneratingKey,
  compact = false,
  onUpgrade,
}: GenerationStatusPanelProps) {
  const cooldown = isQuotaCooldownActive();
  const showPanel = report.overall !== 'completed';

  if (!showPanel && compact) return null;

  const entries = (Object.entries(report.sections) as [SectionKey, SectionStatusEntry][])
    .filter(([, v]) => v.status !== 'skipped');

  return (
    <div className={`rounded-2xl border ${report.quotaExceeded ? 'border-amber-500/30 bg-amber-500/5' : 'border-border bg-card/60'} ${compact ? 'p-4' : 'p-6'}`}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">
            Generation report
          </p>
          <p className={`font-bold ${compact ? 'text-sm' : 'text-base'}`}>{report.summary}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {report.completedCount} of {report.totalRequested} sections ready
            {report.quotaExceeded && cooldown && ' · Wait for cooldown or upgrade credits'}
          </p>
        </div>
        {!compact && report.quotaExceeded && onUpgrade && (
          <button
            type="button"
            onClick={onUpgrade}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Upgrade credits
          </button>
        )}
      </div>

      {showPanel && (
        <ul className="space-y-2">
          {entries.map(([key, section]) => {
            const canRegen =
              section.status !== 'complete' &&
              section.status !== 'skipped' &&
              onRegenerateSection &&
              section.regenerateType &&
              !(report.quotaExceeded && cooldown);

            return (
              <li
                key={key}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-background/60 border border-border/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <StatusIcon status={section.status} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{section.label || SECTION_META[key].label}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {statusLabel(section.status)}
                      {section.message && section.status !== 'complete' ? ` · ${section.message}` : ''}
                    </p>
                  </div>
                </div>
                {canRegen && (
                  <button
                    type="button"
                    disabled={regeneratingKey === key}
                    onClick={() => onRegenerateSection(key, section.regenerateType || SECTION_META[key].regenerateType)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 disabled:opacity-50 shrink-0"
                  >
                    {regeneratingKey === key ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    Regenerate
                  </button>
                )}
                {section.status !== 'complete' && report.quotaExceeded && cooldown && !canRegen && (
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest shrink-0">
                    After cooldown
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {report.quotaExceeded && cooldown && (
        <p className="text-[10px] text-muted-foreground mt-4 leading-relaxed">
          Tip: After the timer resets, regenerate missing sections <strong>one at a time</strong> instead of Full Mastery — this uses fewer credits per attempt.
        </p>
      )}
    </div>
  );
}
