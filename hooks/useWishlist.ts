// src/hooks/useWishlist.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // Certifique-se que o arquivo supabase.ts existe em src/lib/
import { WishlistItem } from '../types';

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

  // Substitua APENAS a função addItem dentro do useWishlist.ts por esta:

const addItem = async (itemData: Omit<WishlistItem, 'id'>, imageFile?: File) => {
    console.log("1. Iniciando addItem..."); // LOG
    setLoading(true);
    try {
      let publicUrl = itemData.imageUrl;

      if (imageFile) {
        console.log("2. Tenho imagem, tentando upload..."); // LOG
        
        // Verifica conexão básica antes
        if (!supabase.storage) {
             throw new Error("Supabase Storage não foi carregado! Verifique o .env");
        }

        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        console.log("3. Enviando para bucket 'wishlist'..."); // LOG
        const { error: uploadError } = await supabase.storage
          .from('wishlist')
          .upload(filePath, imageFile);

        if (uploadError) {
             console.error("ERRO NO UPLOAD:", uploadError); // LOG DE ERRO
             throw uploadError;
        }
        
        console.log("4. Upload sucesso. Pegando URL..."); // LOG
        const { data } = supabase.storage.from('wishlist').getPublicUrl(filePath);
        publicUrl = data.publicUrl;
      }

      console.log("5. Salvando dados no banco...", publicUrl); // LOG
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

      if (error) {
           console.error("ERRO NO INSERT:", error); // LOG DE ERRO
           throw error;
      }
      
      console.log("6. Sucesso total! Atualizando lista..."); // LOG
      await fetchItems();
      return true;

    } catch (error) {
      console.error('ERRO GERAL:', error); // LOG FINAL
      alert(`Erro: ${error.message || JSON.stringify(error)}`); // Alerta na tela para você ver
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