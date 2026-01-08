import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date; // O front usa 'start'
  end?: Date;  // O front usa 'end'
  color?: string;
  status?: 'pending' | 'completed';
  type?: string;
  amount?: number;
}

export function useAgenda() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: true });

      if (error) throw error;
      
      // Mapeia do Banco (start_time) para o Front (start)
      const formattedEvents = data?.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        start: new Date(item.start_time), // Converte string ISO para Date
        end: item.end_time ? new Date(item.end_time) : undefined,
        color: item.color,
        status: item.status,
        type: item.type,
        amount: item.amount
      })) || [];

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Erro ao buscar agenda:', error);
    }
  };

  const addEvent = async (eventData: Partial<CalendarEvent>) => {
    setLoading(true);
    try {
      if (!eventData.title || !eventData.start) throw new Error("Título e Data são obrigatórios");

      // Prepara objeto para o banco
      const dbPayload = {
        title: eventData.title,
        description: eventData.description,
        start_time: eventData.start.toISOString(), // Banco exige ISO String
        end_time: eventData.end ? eventData.end.toISOString() : eventData.start.toISOString(), // Se não tiver fim, usa o inicio
        color: eventData.color || 'blue',
        status: eventData.status || 'pending',
        type: eventData.type || 'event',
        amount: eventData.amount
      };

      const { error } = await supabase
        .from('events')
        .insert([dbPayload]);

      if (error) throw error;
      
      await fetchEvents();
      return true;
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      alert('Erro ao salvar: ' + (error as any).message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
    }
  };

  // Função extra para atualizar status (ex: marcar tarefa como feita)
  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      const { error } = await supabase
        .from('events')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      await fetchEvents();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  return { events, loading, addEvent, deleteEvent, toggleStatus, refresh: fetchEvents };
}