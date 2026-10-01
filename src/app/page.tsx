// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import CopilotUI from '@/components/CopilotUI';
import MapUI from '@/components/MapUi';

type Filters = {
  maxPrice: number;
  keyword: string;
};

export default function Home() {
  const [spaces, setSpaces] = useState([]);
  const [filters, setFilters] = useState<Filters>({ maxPrice: 0, keyword: '' });

  // Karena ini adalah Client Component, kita fetch data manual melalui fungsi terpisah
  // Di modul optimasi nanti, kita akan belajar cara menggabungkan Server Component dengan interaktivitas
  useEffect(() => {
    const fetchSpaces = async () => {
      // Kita mem-bypass Server Component untuk sementara
      // Dalam skenario nyata, buatlah API route misal: /api/spaces?maxPrice=x
      
      // MOCK DATA (Untuk menguji filter AI)
      // Nanti kita akan hubungkan kembali dengan Prisma API
      const rawData = [
        { id: '1', title: 'Cimahi Creative Hub', price: 250000, latitude: -6.8732, longitude: 107.5404 },
        { id: '2', title: 'Bandung Premium Space', price: 800000, latitude: -6.9147, longitude: 107.6098 },
      ];

      // Terapkan filter yang didapat dari AI
      let filteredData = rawData;
      if (filters.maxPrice) {
        filteredData = filteredData.filter(s => s.price <= filters.maxPrice);
      }
      if (filters.keyword) {
        filteredData = filteredData.filter(s => s.title.toLowerCase().includes(filters.keyword.toLowerCase()));
      }

      setSpaces(filteredData as any);
    };

    fetchSpaces();
  }, [filters]); // Fetch ulang setiap kali filter dari AI berubah

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">GeoConnect AI</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Kolom AI Copilot (1/3 layar) */}
          <div className="lg:col-span-1">
             <CopilotUI onFilterChange={(newFilters) => setFilters(newFilters)} />
          </div>
          
          {/* Kolom Peta (2/3 layar) */}
          <div className="lg:col-span-2">
             <MapUI spaces={spaces} />
          </div>
        </div>
      </div>
    </main>
  );
}