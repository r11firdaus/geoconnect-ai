// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// Fungsi untuk menginisialisasi Prisma Client
const prismaClientSingleton = () => {
  return new PrismaClient({
    // Opsional namun disarankan: Menampilkan log query SQL di terminal saat development
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

// Mencegah TypeScript error pada objek global
declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

// Gunakan instance global jika sudah ada, jika belum buat yang baru
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

// Simpan ke global object HANYA di lingkungan development
if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;