import type { BusinessProfile } from '@/types';
import { db, delay, uid } from './mock/db';

export type ProfileInput = Omit<BusinessProfile, 'id' | 'userId' | 'updatedAt'>;

export interface BusinessService {
  getProfile(userId: string): Promise<BusinessProfile | null>;
  saveProfile(userId: string, input: ProfileInput): Promise<BusinessProfile>;
}

export const mockBusinessService: BusinessService = {
  async getProfile(userId) {
    await delay(250);
    return structuredClone(db.get().profiles.find((p) => p.userId === userId) ?? null);
  },
  async saveProfile(userId, input) {
    await delay(500);
    let saved!: BusinessProfile;
    db.update((s) => {
      const now = new Date().toISOString();
      const idx = s.profiles.findIndex((p) => p.userId === userId);
      if (idx >= 0) {
        saved = { ...s.profiles[idx], ...input, updatedAt: now };
        s.profiles[idx] = saved;
        const sme = s.smes.find((x) => x.profile.userId === userId);
        if (sme) sme.profile = saved;
      } else {
        saved = { ...input, id: uid('bp'), userId, updatedAt: now };
        s.profiles.push(saved);
        s.smes.push({ id: uid('sme'), profile: saved, joinedAt: now.slice(0, 10), financingIntent: 'exploring' });
      }
      const user = s.users.find((u) => u.id === userId);
      if (user) user.name = input.ownerName;
    });
    return structuredClone(saved);
  },
};
