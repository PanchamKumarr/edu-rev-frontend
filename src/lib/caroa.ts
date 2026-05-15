import { API_BASE, getAuthHeaders } from './api';
import { getCAROARecommendation } from './gemini';

export const CAROA = {
  async updateMastery(topicId: string, performanceDelta: number) {
    const res = await fetch(`${API_BASE}/api/caroa/mastery`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ topicId, performanceDelta })
    });
    const data = (await res.json()) as { success?: boolean; message?: string; level?: number };
    if (!res.ok) {
      throw new Error(data.message || 'Mastery update failed');
    }
    return data.level ?? 0;
  },

  async logActivity(activity: Record<string, unknown>) {
    const res = await fetch(`${API_BASE}/api/caroa/activity`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(activity)
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) {
      throw new Error(data.message || 'Activity log failed');
    }
  },

  async fetchRecommendations() {
    const res = await fetch(`${API_BASE}/api/caroa/context`, {
      headers: getAuthHeaders()
    });
    const data = (await res.json()) as {
      success?: boolean;
      message?: string;
      userId?: string;
      masteryProfile?: unknown[];
      availableModules?: unknown[];
    };
    if (!res.ok) {
      throw new Error(data.message || 'Failed to load learner context');
    }

    return getCAROARecommendation(
      { masteryProfile: data.masteryProfile ?? [], userId: data.userId },
      (data.availableModules ?? []) as any[]
    );
  }
};
