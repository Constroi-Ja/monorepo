import { useState, useCallback } from 'react';
import { visitsApi } from '@/api/visits';
import { VisitMessage } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { usePolling } from './usePolling';

export function useVisitMessages(visitId: number | null) {
  const [messages, setMessages] = useState<VisitMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((s) => s.user);

  const myName =
    user?.consumer_profile?.full_name ??
    user?.provider_profile?.full_name ??
    `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim();

  const fetchMessages = useCallback(async () => {
    if (!visitId) return;
    const { data } = await visitsApi.getMessages(visitId);
    if (data) setMessages(data);
  }, [visitId]);

  usePolling(fetchMessages, 8000, !!visitId);

  const sendMessage = async (content: string) => {
    if (!visitId) return;
    const optimistic: VisitMessage = {
      id: Date.now(),
      sender_name: myName,
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    const { data } = await visitsApi.sendMessage(visitId, content);
    if (data) {
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? data : m))
      );
    }
  };

  const loadInitial = async () => {
    setLoading(true);
    await fetchMessages();
    setLoading(false);
  };

  return { messages, loading, sendMessage, loadInitial, myName };
}
