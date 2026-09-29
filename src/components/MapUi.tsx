// src/components/MapUI.tsx
'use client';

import { useState } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css'; // Wajib di-import agar peta tidak hancur

// Mendefinisikan tipe data yang akan diterima dari Server
type Space = {
  id: string;
  title: string;
  price: number;
  latitude: number;
  longitude: number;
};

export default function MapUI({ spaces }: { spaces: Space[] }) {
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);

  return (
    <div className="h-[500px] w-full rounded-xl overflow-hidden shadow-lg">
      <Map
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{
          longitude: 107.5404, // Default ke area Cimahi/Bandung
          latitude: -6.8732,
          zoom: 12,
        }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
      >
        {/* Render semua koordinat dari database sebagai Marker */}
        {spaces.map((space) => (
          <Marker
            key={space.id}
            longitude={space.longitude}
            latitude={space.latitude}
            anchor="bottom"
            onClick={(e) => {
              // Mencegah klik menembus ke peta (zoom)
              e.originalEvent.stopPropagation();
              setSelectedSpace(space);
            }}
          >
            {/* Custom Pin - Bisa diganti SVG atau Icon yang lebih estetik */}
            <div className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-bold cursor-pointer hover:bg-blue-800 transition">
              Rp {space.price.toLocaleString('id-ID')}
            </div>
          </Marker>
        ))}

        {/* Tampilkan Popup jika marker diklik */}
        {selectedSpace && (
          <Popup
            longitude={selectedSpace.longitude}
            latitude={selectedSpace.latitude}
            anchor="top"
            onClose={() => setSelectedSpace(null)}
            closeOnClick={false}
          >
            <div className="text-gray-800 p-2">
              <h3 className="font-bold">{selectedSpace.title}</h3>
              <button className="mt-2 w-full bg-black text-white text-xs py-1 rounded">
                Lihat Detail
              </button>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}