'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { playNotificationChime } from '@/lib/utils/audio-alert';
import { toast } from 'sonner';

export function RealtimeBookingNotifier() {
  const router = useRouter();
  const lastPendingCountRef = useRef<number | null>(null);
  const knownAppointmentIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();

    // 1. Initial baseline fetch of pending appointment IDs
    async function initBaseline() {
      try {
        const { data } = await supabase
          .from('appointments')
          .select('id')
          .eq('status', 'pending')
          .is('deleted_at', null);

        if (data) {
          data.forEach((item) => knownAppointmentIdsRef.current.add(item.id));
          lastPendingCountRef.current = data.length;
        }
      } catch (err) {
        console.warn('Failed to load baseline pending appointments count:', err);
      }
    }

    initBaseline();

    // 2. Realtime WebSocket subscription for instant push
    const channel = supabase
      .channel('clinic_realtime_appointments_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments',
        },
        async (payload) => {
          const newApt = payload.new as any;
          if (!newApt || !newApt.id) return;

          // Prevent duplicate alerts if already announced
          if (knownAppointmentIdsRef.current.has(newApt.id)) return;
          knownAppointmentIdsRef.current.add(newApt.id);

          // Play synthesized clinic chime sound
          playNotificationChime();

          // Fetch treatment name if available
          let treatmentLabel = 'Aesthetic Consultation';
          if (newApt.treatment_id) {
            try {
              const { data: tData } = await supabase
                .from('treatments')
                .select('name')
                .eq('id', newApt.treatment_id)
                .maybeSingle();
              if (tData?.name) treatmentLabel = tData.name;
            } catch {}
          }

          // Trigger toast notification
          toast.success(`🔔 New Booking Received!`, {
            description: `${newApt.customer_name || 'Patient'} booked ${treatmentLabel} (${newApt.customer_phone || ''})`,
            duration: 9000,
            action: {
              label: 'View Queue',
              onClick: () => router.push('/dashboard/appointments?status=pending'),
            },
          });

          // Dispatch global window event for components
          window.dispatchEvent(
            new CustomEvent('clinic_appointment_created', { detail: newApt })
          );

          // Revalidate current server component view
          router.refresh();
        }
      )
      .subscribe();

    // 3. Heartbeat polling fallback (every 20s) to catch any network-dropped insertions
    const interval = setInterval(async () => {
      try {
        const { data } = await supabase
          .from('appointments')
          .select('id, customer_name, customer_phone, scheduled_at, status')
          .eq('status', 'pending')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!data) return;

        let hasNewUnseen = false;
        let newestPatient = '';

        for (const item of data) {
          if (!knownAppointmentIdsRef.current.has(item.id)) {
            hasNewUnseen = true;
            newestPatient = item.customer_name;
            knownAppointmentIdsRef.current.add(item.id);
          }
        }

        if (hasNewUnseen && lastPendingCountRef.current !== null) {
          playNotificationChime();
          toast.success(`🔔 New Appointment Waiting!`, {
            description: newestPatient
              ? `New booking from ${newestPatient}. Awaiting doctor approval.`
              : 'New patient appointment request received.',
            duration: 8000,
            action: {
              label: 'View Requests',
              onClick: () => router.push('/dashboard/appointments?status=pending'),
            },
          });
          window.dispatchEvent(new CustomEvent('clinic_appointment_created'));
          router.refresh();
        }

        lastPendingCountRef.current = data.length;
      } catch {}
    }, 20000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [router]);

  return null;
}
