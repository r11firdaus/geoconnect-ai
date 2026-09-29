// src/app/page.tsx
import MapUI from '@/components/MapUi';
import prisma from '@/lib/prisma';

// Revalidate cache setiap 60 detik. 
// Ini optimasi tingkat senior: Database hanya di-query 1 kali per menit 
// untuk semua pengunjung, sangat menghemat biaya operasional database!
export const revalidate = 60; 

export default async function Home() {
  // 1. Ambil data langsung dari Supabase tanpa perlu Fetch API
  const spaces = await prisma.space.findMany({
    select: {
      id: true,
      title: true,
      price: true,
      latitude: true,
      longitude: true,
    },
  });

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">GeoConnect AI</h1>
        <p className="text-gray-600 mb-8">
          Temukan coworking space terbaik di sekitar Anda.
        </p>
        
        {/* 2. Lempar data ke Client Component */}
        <MapUI spaces={spaces} />
      </div>
    </main>
  );
}