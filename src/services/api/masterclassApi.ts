import type { Masterclass, MasterclassStatus, Speaker } from '@/types';
import { ApiError, apiRequest } from './client';
import { ServiceError } from '../errors';
import type { MasterclassInput, MasterclassService } from '../masterclassService';

/** Maps transport/API failures onto the errors the UI already knows how to explain. */
async function guard<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.code === 'has_registrations') throw new ServiceError('has_registrations');
      if (e.status === 404) throw new ServiceError('not_found');
      if (e.status === 422) throw new ServiceError('validation');
    }
    throw new ServiceError('unavailable');
  }
}

/** The form holds picked images as blob:/data: URLs; upload them and swap in the stored URL. */
async function persistImage(src: string | undefined): Promise<string> {
  if (!src) return '';
  if (!src.startsWith('blob:') && !src.startsWith('data:')) return src;
  const blob = await (await fetch(src)).blob();
  const form = new FormData();
  form.append('file', blob, 'upload');
  const out = await apiRequest<{ url: string }>('/admin/uploads', { method: 'POST', body: form });
  return out.url;
}

export const apiMasterclassService: MasterclassService = {
  listPublic: () => guard(() => apiRequest<Masterclass[]>('/masterclasses')),
  listAll: () => guard(() => apiRequest<Masterclass[]>('/admin/masterclasses')),
  async get(id) {
    try {
      return await guard(() => apiRequest<Masterclass>(`/masterclasses/${encodeURIComponent(id)}`));
    } catch (e) {
      if (!(e instanceof ServiceError) || e.code !== 'not_found') throw e;
      // Drafts are only visible to signed-in admins.
      return guard(() => apiRequest<Masterclass>(`/admin/masterclasses/${encodeURIComponent(id)}`));
    }
  },
  async create(input: MasterclassInput) {
    const cover = await persistImage(input.cover).catch(() => Promise.reject(new ServiceError('unavailable')));
    return guard(() => apiRequest<Masterclass>('/admin/masterclasses', { method: 'POST', json: { ...input, cover } }));
  },
  async update(id, input: MasterclassInput) {
    const cover = await persistImage(input.cover).catch(() => Promise.reject(new ServiceError('unavailable')));
    return guard(() => apiRequest<Masterclass>(`/admin/masterclasses/${encodeURIComponent(id)}`, { method: 'PUT', json: { ...input, cover } }));
  },
  setStatus: (id, status: MasterclassStatus) =>
    guard(() => apiRequest<void>(`/admin/masterclasses/${encodeURIComponent(id)}/status`, { method: 'PATCH', json: { status } })),
  remove: (id) => guard(() => apiRequest<void>(`/admin/masterclasses/${encodeURIComponent(id)}`, { method: 'DELETE' })),
  listSpeakers: () => guard(() => apiRequest<Speaker[]>('/speakers')),
  async saveSpeaker(input) {
    const photo = await persistImage(input.photo).catch(() => Promise.reject(new ServiceError('unavailable')));
    const json = { ...input, photo };
    return guard(() =>
      input.id
        ? apiRequest<Speaker>(`/admin/speakers/${encodeURIComponent(input.id)}`, { method: 'PUT', json })
        : apiRequest<Speaker>('/admin/speakers', { method: 'POST', json }),
    );
  },
};
