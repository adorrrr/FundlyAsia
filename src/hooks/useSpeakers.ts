import { useAsync } from './useAsync';
import { masterclassService } from '@/services';
import type { Speaker } from '@/types';

/** Speakers keyed by id, loaded once per screen through the service layer. */
export function useSpeakers() {
  const { data } = useAsync(() => masterclassService.listSpeakers(), []);
  const map = new Map<string, Speaker>((data ?? []).map((s) => [s.id, s]));
  return { list: data ?? [], byId: (id: string) => map.get(id) };
}
