import { roundTo } from './geometry.js';
import type {
  AuditFlagResult,
  BoqAuditResult,
  BoqItemInput,
  BoqQuoteMode,
  ConstructionStageKey,
  MaterialEstimateLine,
} from './types.js';

export interface BaselineBoqReferenceItem {
  itemCode: string;
  stageKey: ConstructionStageKey;
  label: string;
  baselineUnitRateLkr: number;
  requiredInTurnkey: boolean;
}

export const DEFAULT_AUDIT_BASELINE_ITEMS: BaselineBoqReferenceItem[] = [
  { itemCode: 'FND_EXCAVATION', stageKey: 'FOUNDATION', label: 'Foundation excavation & rubble work', baselineUnitRateLkr: 14500, requiredInTurnkey: true },
  { itemCode: 'SUP_MASONRY', stageKey: 'SUPERSTRUCTURE', label: 'Blockwork & RCC columns/lintels', baselineUnitRateLkr: 6800, requiredInTurnkey: true },
  { itemCode: 'ROOF_TRUSS', stageKey: 'ROOFING', label: 'Roof structure & sheets', baselineUnitRateLkr: 7200, requiredInTurnkey: true },
  { itemCode: 'ROOF_WATERPROOF', stageKey: 'ROOFING', label: 'Roof & wet-area waterproofing', baselineUnitRateLkr: 2900, requiredInTurnkey: true },
  { itemCode: 'MEP_WIRING_PLUMB', stageKey: 'MEP', label: 'Electrical wiring & plumbing rough-in', baselineUnitRateLkr: 4800, requiredInTurnkey: true },
  { itemCode: 'FIN_TILING', stageKey: 'FINISHES', label: 'Floor tiling & finishing works', baselineUnitRateLkr: 5800, requiredInTurnkey: true },
];

export interface AuditBoqParams {
  boqId: string;
  quoteMode: BoqQuoteMode;
  items: BoqItemInput[];
  roughEstimateTotalLkr: number;
  planMaterialBaseline?: MaterialEstimateLine[];
  baselineItems?: BaselineBoqReferenceItem[];
}

/**
 * Audits an itemised contractor BOQ against the rough estimate and confirmed plan baseline.
 * Flags are review signals requiring contractor justification—not proof of fraud.
 */
export function auditBoqQuotation(params: AuditBoqParams): BoqAuditResult {
  const baseline = params.baselineItems ?? DEFAULT_AUDIT_BASELINE_ITEMS;
  const quoteTotalLkr = Math.round(
    params.items.reduce((sum, item) => sum + item.quantity * item.unitRateLkr * (1 + item.labourMarkupPct / 100), 0)
  );
  const variancePct =
    params.roughEstimateTotalLkr > 0
      ? roundTo(((quoteTotalLkr - params.roughEstimateTotalLkr) / params.roughEstimateTotalLkr) * 100, 1)
      : 0;

  const flags: AuditFlagResult[] = [];
  const presentCodes = new Set(params.items.map((i) => i.itemCode));

  // 1. Check Missing Items (especially in WITH_MATERIALS turnkey quotes, or missing stage coverage)
  for (const ref of baseline) {
    if (params.quoteMode === 'WITH_MATERIALS' && ref.requiredInTurnkey && !presentCodes.has(ref.itemCode)) {
      flags.push({
        id: `flag-missing-${ref.itemCode}`,
        itemCode: ref.itemCode,
        stageKey: ref.stageKey,
        flagType: 'MISSING_ITEM',
        severity: 'CRITICAL',
        explanation: `Review signal: '${ref.label}' (${ref.itemCode}) from the confirmed plan baseline is omitted from this turnkey quotation. Ask the contractor whether it is excluded or bundled elsewhere.`,
      });
    }
  }

  // 2. Check Low Regional Material Rates and High Labour Markups
  const baselineMap = new Map(baseline.map((b) => [b.itemCode, b]));
  for (const item of params.items) {
    const ref = baselineMap.get(item.itemCode);
    if (params.quoteMode === 'WITH_MATERIALS' && ref && ref.baselineUnitRateLkr > 0) {
      const ratio = item.unitRateLkr / ref.baselineUnitRateLkr;
      if (ratio < 0.78) {
        flags.push({
          id: `flag-low-${item.id}`,
          boqItemId: item.id,
          itemCode: item.itemCode,
          stageKey: item.stageKey,
          flagType: 'PRICE_LOW_WARNING',
          severity: 'WARNING',
          explanation: `Review signal: Quoted unit rate (LKR ${item.unitRateLkr.toLocaleString()}) is ${Math.round((1 - ratio) * 100)}% below the reference baseline (LKR ${ref.baselineUnitRateLkr.toLocaleString()}). Verify material specification/grade before acceptance.`,
        });
      } else if (ratio > 1.38) {
        flags.push({
          id: `flag-rate-high-${item.id}`,
          boqItemId: item.id,
          itemCode: item.itemCode,
          stageKey: item.stageKey,
          flagType: 'PRICE_HIGH_WARNING',
          severity: 'WARNING',
          explanation: `Review signal: Quoted unit rate (LKR ${item.unitRateLkr.toLocaleString()}) is ${Math.round((ratio - 1) * 100)}% above the reference baseline (LKR ${ref.baselineUnitRateLkr.toLocaleString()}). Request itemised breakdown.`,
        });
      }
    }

    if (item.labourMarkupPct > 28) {
      flags.push({
        id: `flag-markup-${item.id}`,
        boqItemId: item.id,
        itemCode: item.itemCode,
        stageKey: item.stageKey,
        flagType: 'PRICE_HIGH_WARNING',
        severity: 'WARNING',
        explanation: `Review signal: Labour/overhead markup of ${item.labourMarkupPct}% on '${item.description}' exceeds typical 15%–25% guideline. Contractor can justify site complexity in rebuttal.`,
      });
    }
  }

  const summaryNote =
    flags.length === 0
      ? 'No missing baseline items or rate anomalies detected against current reference bounds.'
      : `${flags.length} review signal(s) flagged. These highlight items to clarify with the contractor via the rebuttal panel and are not proof of fraud.`;

  return {
    boqId: params.boqId,
    quoteTotalLkr,
    roughEstimateTotalLkr: params.roughEstimateTotalLkr,
    variancePct,
    flags,
    summaryNote,
  };
}
