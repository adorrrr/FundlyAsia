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
      const sme = smes.data?.find((s) => s.profile.userId === r.userId);
      const reg = regs.data?.find((x) => x.userId === r.userId && x.amountRange);
      return {
        id: r.id,
        smeId: sme?.id,
        owner: sme?.profile.ownerName ?? '—',
        business: sme?.profile.businessName ?? '—',
        date: r.createdAt,
        score: r.score,
        band: r.band,
        gaps: r.improvements,
        intent: sme?.financingIntent,
        amountRange: reg?.amountRange,
      };
    });
  }, [results.data, smes.data, regs.data]);
  return { rows, loading: results.loading || smes.loading || regs.loading };
}
