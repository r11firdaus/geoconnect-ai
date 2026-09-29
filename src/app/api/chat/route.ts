// src/app/api/chat/route.ts
import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod'; // Zod sudah terinstal bawaan dari 'ai'

export const maxDuration = 30; // Batas waktu eksekusi Vercel (penting untuk API AI)

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: google('gemini-3.8-flash'), // Model terbaru, sangat cepat & mendukung tool calling
    messages,
    system: `Anda adalah AI Copilot untuk platform GeoConnect.
    Tugas Anda adalah membantu user mencari coworking space atau properti.
    Jika user memberikan kriteria pencarian (harga, kata kunci), gunakan tool 'searchSpaces'.
    Bersikaplah ramah dan profesional.`,
    
    // Ini bagian magisnya: Kita mendefinisikan "Alat" yang bisa dipakai AI
    tools: {
      searchSpaces: tool({
        description: 'Mengekstrak kriteria pencarian dari input user untuk memfilter database',
        // Zod memaksa Gemini untuk mematuhi struktur data (skema) yang kita inginkan
        parameters: z.object({
          maxPrice: z.number().optional().describe('Harga maksimal yang bersedia dibayar user'),
          keyword: z.string().optional().describe('Kata kunci lokasi, nama, atau fasilitas'),
        }),
        // Eksekusi ini berjalan di server ketika Gemini memutuskan untuk memanggil tool
        execute: async ({ maxPrice, keyword }: { maxPrice?: number; keyword?: string }) => {
          // Di dunia nyata, Anda bisa memanggil Prisma langsung di sini.
          // Namun, untuk tutorial ini, kita kembalikan JSON filter-nya ke UI 
          // agar UI bisa melakukan re-fetch data.
          return {
            filters_applied: {
              maxPrice,
              keyword
            },
            status: "success"
          };
        },
      }),
    },
    // Mengizinkan AI untuk memberikan teks biasa, atau memanggil tool, atau keduanya
    maxSteps: 5, 
  });

  return result.toDataStreamResponse();
}