'use server';

import prisma from '@/lib/prisma';

export async function sendMessage(spaceId: string, senderId: string, content: string) {
  try {
    // Menggunakan Prisma untuk validasi dan insert data ke database.
    // Mengapa Prisma di sini dan bukan Supabase Client? 
    // Karena Prisma berjalan di lingkungan server yang aman dan memiliki type-checking yang ketat.
    const message = await prisma.message.create({
      data: {
        spaceId,
        senderId,
        content,
      },
    });

    return {success: true, message};
  } catch (error) {
    console.error('Gagal mengirim pesan:', error);
    return {success: false, error: 'Gagal mengirim pesan. Silakan coba lagi.'};
  }
}