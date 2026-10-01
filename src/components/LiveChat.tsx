// src/components/LiveChat.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { sendMessage } from '@/app/actions/chat'; // Import Server Action

// Inisialisasi Supabase Client di LUAR komponen 
// agar tidak tercipta koneksi baru setiap kali komponen re-render.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Message = {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
};

export default function LiveChat({ spaceId, currentUserId }: { spaceId: string, currentUserId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null); // Untuk auto-scroll ke pesan terbaru

  useEffect(() => {
    // Auto-scroll ke bawah saat ada pesan baru
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // 1. Fetch pesan lama saat komponen dimuat (Bisa juga dipindah ke Server Component)
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from('Message')
        .select('*')
        .eq('spaceId', spaceId)
        .order('createdAt', { ascending: true });
      if (data) setMessages(data as Message[])
      else console.error('Error fetching chat history:', error);
    };
    fetchHistory();

    // 2. Berlangganan (Subscribe) ke event WebSockets
    // Penjelasan Mendalam: Kita tidak asal mendengarkan SEMUA perubahan.
    // Kita memfilter (spaceId=eq.${spaceId}) langsung di level database.
    // Ini menghemat bandwidth dan mencegah kebocoran data chat ruangan lain.
    const channel = supabase
      .channel(`chat_room_${spaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Message',
          filter: `spaceId=eq.${spaceId}`, 
        },
        (payload) => {
          // Ketika ada baris baru diinsert ke DB, langsung masukkan ke state React
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            // Mencegah duplikasi jika pesan dikirim oleh user ini sendiri
            if (prev.find(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    // 3. Clean up fungsi saat komponen di-unmount (User pindah halaman)
    // Sangat krusial agar memori browser tidak bocor (memory leak).
    return () => {
      supabase.removeChannel(channel);
    };
  }, [spaceId]);

  const handleSend = async (e: React.FormEvent) => {
    const sendButton = document.getElementById('send-button') as HTMLButtonElement;
    sendButton.disabled = true; // Disable tombol kirim untuk mencegah spam klik
    e.preventDefault();
    if (!input.trim()) return sendButton.disabled = false; // Enable tombol kirim setelah pengiriman selesai;

    const content = input;
    setInput(''); // Kosongkan input agar terasa responsif

    // Panggil Server Action
    // Perhatikan: Kita tidak perlu secara manual menambahkan hasil balasan ini ke 'setMessages'
    // Karena saat Prisma melakukan INSERT di server, event 'postgres_changes' 
    // akan terpicu dan otomatis memperbarui UI melalui efek useEffect di atas!
    await sendMessage(spaceId, currentUserId, content);
    sendButton.disabled = false; // Enable tombol kirim setelah pengiriman selesai
  };

  return (
    <div className="flex flex-col h-[400px] border rounded-xl bg-white shadow-sm overflow-hidden">
      <div className="bg-gray-900 text-white p-3 font-bold text-sm">
        💬 Negosiasi Langsung
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${
                isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-200 text-gray-800 rounded-tl-none'
              }`}>
                {msg.content}
              </div>
            </div>
          );
        })}
        {/* Div tak terlihat sebagai anchor untuk auto-scroll */}
        <div ref={messagesEndRef} /> 
      </div>

      <form onSubmit={handleSend} className="p-3 bg-white border-t flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tawar harga atau tanya fasilitas..."
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-700"
        />
        <button id="send-button" type="submit" className="bg-black text-white px-4 py-2 rounded-lg font-bold text-sm">
          Kirim
        </button>
      </form>
    </div>
  );
}