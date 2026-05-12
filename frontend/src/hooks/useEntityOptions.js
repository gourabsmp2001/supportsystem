import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

let cache = { retailers: null, brands: null };

export function useEntityOptions() {
  const [retailers, setRetailers] = useState(cache.retailers || []);
  const [brands, setBrands] = useState(cache.brands || []);

  useEffect(() => {
    async function load() {
      if (!cache.retailers) {
        const { data } = await supabase
          .from('retailers')
          .select('retail_name')
          .eq('status', 'Active')
          .order('retail_name');
        const names = [...new Set((data || []).map((r) => r.retail_name).filter(Boolean))];
        cache.retailers = names;
        setRetailers(names);
      }

      if (!cache.brands) {
        const { data } = await supabase
          .from('brands')
          .select('brand_name')
          .eq('status', 'Active')
          .order('brand_name');
        const names = [...new Set((data || []).map((b) => b.brand_name).filter(Boolean))];
        cache.brands = names;
        setBrands(names);
      }
    }
    load();
  }, []);

  return { retailers, brands };
}

export function invalidateEntityCache() {
  cache = { retailers: null, brands: null };
}
