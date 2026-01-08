// src/hooks/useWishlist.ts
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase'; // Certifique-se que o arquivo supabase.ts existe em src/lib/
import { WishlistItem } from '../../types';

export function useWishlist() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedData = data?.map(item => ({
        ...item,
        savedAmount: item.saved_amount, 
        imageUrl: item.image_url,
        targetMonth: item.target_month
      })) || [];

      setItems(formattedData as WishlistItem[]);
    } catch (error) {
      console.error('Erro ao buscar desejos:', error);
    }
  };

  const addItem = async (itemData: Omit<WishlistItem, 'id'>, imageFile?: File) => {
    setLoading(true);
    try {
      let publicUrl = itemData.imageUrl;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('wishlist')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('wishlist').getPublicUrl(filePath);
        publicUrl = data.publicUrl;
      }

      const { error } = await supabase
        .from('wishlist')
        .insert([{
          name: itemData.name,
          price: itemData.price,
          saved_amount: itemData.savedAmount,
          image_url: publicUrl,
          priority: itemData.priority,
          category: itemData.category,
          viability: itemData.viability,
          target_month: itemData.targetMonth
        }]);

      if (error) throw error;
      await fetchItems();
      return true;
    } catch (error) {
      console.error('Erro ao salvar:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase.from('wishlist').delete().eq('id', id);
      if (error) throw error;
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Erro ao deletar:', error);
    }
  };

  return { items, loading, addItem, deleteItem, refresh: fetchItems };
}