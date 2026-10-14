import type { Masterclass, MasterclassStatus, RegistrationAvailability, Speaker } from '@/types';
import { db, delay, uid } from './mock/db';
import { ServiceError } from './errors';
import { hasEnded, todayISO } from '@/utils/date';

export type MasterclassInput = Omit<Masterclass, 'id' | 'slug' | 'seatsTaken'>;

export interface MasterclassService {
  listPublic(): Promise<Masterclass[]>;
  listAll(): Promise<Masterclass[]>;
  get(id: string): Promise<Masterclass>;
  create(input: MasterclassInput): Promise<Masterclass>;
  update(id: string, input: MasterclassInput): Promise<Masterclass>;
  setStatus(id: string, status: MasterclassStatus): Promise<void>;
  remove(id: string): Promise<void>;
  listSpeakers(): Promise<Speaker[]>;
  saveSpeaker(speaker: Omit<Speaker, 'id'> & { id?: string }): Promise<Speaker>;
  removeSpeaker(id: string): Promise<void>;
}

const byDate = (a: Masterclass, b: Masterclass) => (a.date || '9999').localeCompare(b.date || '9999');

export const mockMasterclassService: MasterclassService = {
  async listPublic() {
    await delay(300);
    return structuredClone(db.get().masterclasses.filter((m) => m.status !== 'draft').sort(byDate));
  },
  async listAll() {
    await delay(250);
    return structuredClone([...db.get().masterclasses].sort(byDate));
  },
  async get(id) {
    await delay(250);
    const m = db.get().masterclasses.find((x) => x.id === id || x.slug === id);
    if (!m) throw new ServiceError('not_found');
    return structuredClone(m);
  },
  async create(input) {
    await delay(500);
    const m: Masterclass = { ...input, id: uid('mc'), slug: slugify(input.title.en), seatsTaken: 0 };
    db.update((s) => s.masterclasses.push(m));
    return structuredClone(m);
  },
  async update(id, input) {
    await delay(500);
    let out!: Masterclass;
    db.update((s) => {
      const i = s.masterclasses.findIndex((x) => x.id === id);
      if (i < 0) throw new ServiceError('not_found');
      out = { ...s.masterclasses[i], ...input };
      s.masterclasses[i] = out;
    });
    return structuredClone(out);
  },
  async setStatus(id, status) {
    await delay(300);
    db.update((s) => {
      const m = s.masterclasses.find((x) => x.id === id);
      if (m) m.status = status;
    });
  },
  async remove(id) {
    await delay(400);
    db.update((s) => {
      const i = s.masterclasses.findIndex((x) => x.id === id);
      if (i < 0) throw new ServiceError('not_found');
      if (s.registrations.some((r) => r.masterclassId === id && r.status !== 'cancelled')) {
        throw new ServiceError('has_registrations');
      }
      s.registrations = s.registrations.filter((r) => r.masterclassId !== id);
      s.masterclasses.splice(i, 1);
    });
  },
  async listSpeakers() {
    await delay(200);
    return structuredClone(db.get().speakers);
  },
  async saveSpeaker(input) {
    await delay(400);
    let out!: Speaker;
    db.update((s) => {
      if (input.id) {
        const i = s.speakers.findIndex((x) => x.id === input.id);
        out = { ...s.speakers[i], ...input, id: input.id };
        s.speakers[i] = out;
      } else {
        out = { ...input, id: uid('sp') };
        s.speakers.push(out);
      }
    });
    return structuredClone(out);
  },
  async removeSpeaker(id) {
    await delay(300);
    db.update((s) => {
      const i = s.speakers.findIndex((x) => x.id === id);
      if (i >= 0) s.speakers.splice(i, 1);
      s.masterclasses.forEach((m) => {
        if (m.speakerId === id) m.speakerId = '';
      });
    });
  },
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || uid('mc');
}

/** Whether a masterclass can take registrations right now, based only on its own data. */
export function registrationAvailability(m: Masterclass, today = todayISO()): RegistrationAvailability {
  if (m.status === 'cancelled') return { open: false, reason: 'cancelled' };
  if (m.status === 'completed') return { open: false, reason: 'completed' };
  if (m.status === 'draft') return { open: false, reason: 'draft' };
  if (m.status === 'registration_closed' || m.status === 'published') return { open: false, reason: 'closed' };
  if (hasEnded(m)) return { open: false, reason: 'completed' };
  if (m.registrationDeadline && m.registrationDeadline < today) return { open: false, reason: 'deadline' };
  if (m.seatsTaken >= m.capacity) return { open: false, reason: 'full' };
  return { open: true };
}
