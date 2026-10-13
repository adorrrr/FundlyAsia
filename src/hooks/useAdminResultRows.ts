import { useMemo } from 'react';
import { useAsync } from './useAsync';
import { adminService, eligibilityService, registrationService } from '@/services';
import type { FinancingIntent, FinancingRange, Localized, ReadinessBand } from '@/types';

export interface ResultRow {
  id: string;
  smeId?: string;
  owner: string;
  business: string;
  date: string;
  score: number;
  band: ReadinessBand;
  gaps: Localized[];
  intent?: FinancingIntent;
  amountRange?: FinancingRange;
}

/** Joins results with SME profiles and their latest stated financing amount. */
export function useAdminResultRows() {
  const results = useAsync(() => eligibilityService.listAllResults(), []);
  const smes = useAsync(() => adminService.listSmes(), []);
  const regs = useAsync(() => registrationService.listAll(), []);
  const rows = useMemo<ResultRow[]>(() => {
    return (results.data ?? []).map((r) => {
      const targetUserId = r.userId ?? (r as unknown as { smeId?: string }).smeId;
      const sme = smes.data?.find((s) => s.profile.userId === targetUserId);
      const reg = regs.data?.find((x) => x.userId === targetUserId && x.amountRange);
      const anyR = r as unknown as { owner?: string; business?: string; date?: string; topGaps?: string[] };

      return {
        id: r.id,
        smeId: sme?.id ?? targetUserId,
        owner: sme?.profile.ownerName ?? r.userName ?? anyR.owner ?? '-',
        business: sme?.profile.businessName ?? r.businessName ?? anyR.business ?? '-',
        date: r.createdAt ?? anyR.date ?? '',
        score: r.score,
        band: r.band,
        gaps: r.improvements ?? (anyR.topGaps ? anyR.topGaps.map((g) => ({ en: g, bn: g })) : []),
        intent: sme?.financingIntent,
        amountRange: reg?.amountRange,
      };
    });

  }, [results.data, smes.data, regs.data]);
  return { rows, loading: results.loading || smes.loading || regs.loading };
}
