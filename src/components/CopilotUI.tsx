// 'use client' wajib digunakan karena komponen ini menggunakan:
// - useState()
// - useEffect()
// - useChat()
// Semua fitur tersebut berjalan di sisi browser/client.
'use client';

// Pada AI SDK versi terbaru, useChat tidak lagi diambil dari 'ai/react'.
// Gunakan package React khusus dari AI SDK:
import { useChat } from '@ai-sdk/react';

import { useEffect, useState } from 'react';


// Tipe sederhana untuk filter yang akan dikirim ke parent.

type Filters = {
  // [key: string]: any;
  title:       string;
  description: string;
  price:       number;
  latitude:    number;
  longitude:   number;
  createdAt:   string;
};


// Komponen CopilotUI menerima function `onFilterChange` dari parent.
//
// Parent (misalnya page.tsx) dapat menggunakan function ini
// untuk memperbarui filter pada peta / daftar properti.
//
// Contoh dari parent:
//
// <CopilotUI
//   onFilterChange={(filters) => {
//     setFilters(filters);
//   }}
// />
//
export default function CopilotUI({onFilterChange}: { onFilterChange: (filters: Filters) => void;}) {

  // ============================================================
  // STATE INPUT
  // ============================================================
  // Pada AI SDK versi lama, useChat() menyediakan:
  // const { input, handleInputChange, handleSubmit } = useChat();

  // Pada AI SDK versi baru, API tersebut sudah berubah.
  // Karena itu kita mengelola input sendiri menggunakan React state.
    const [input, setInput] = useState('');


  // ============================================================
  // useChat()
  // ============================================================
  // useChat() mengelola percakapan dengan AI.
  // `messages`
  // ----------------
  // Berisi seluruh pesan dalam percakapan:
  // - pesan user
  // - pesan assistant
  // - bagian/tool yang digunakan assistant

  // `sendMessage`
  // ----------------
  // Digunakan untuk mengirim pesan baru ke AI. Pada versi AI SDK yang baru, kita menggunakan:
  // sendMessage({
  //   text: input
  // });
  // bukan lagi handleSubmit() dari useChat().
    const { messages, sendMessage } = useChat();


  // ============================================================
  // MEMANTAU TOOL CALL DARI AI
  // ============================================================

  useEffect(() => {
  // Ambil pesan terakhir dari percakapan.
    
  // Contoh:
    
  // messages = [
  //   pesan user,
  //   pesan assistant,
  //   pesan assistant terbaru
  // ]
    
  // Maka messages[messages.length - 1] adalah pesan assistant terbaru.
    
    const lastMessage = messages[messages.length - 1];
  // Jika tidak ada pesan terakhir, tidak ada yang perlu diproses.
    
    if (!lastMessage) return;

  // Kita hanya tertarik pada pesan dari AI/assistant.
  // Jangan memproses pesan user karena user tidak menjalankan tool `searchSpaces`.
    
    if (lastMessage.role !== 'assistant') return;


  // ==========================================================
  // AI SDK BARU MENGGUNAKAN `parts`
  // ==========================================================
  // Pada AI SDK lama kita mungkin menemukan:
  // lastMessage.toolInvocations
  // Tetapi pada AI SDK terbaru struktur pesan menggunakan:
  // lastMessage.parts
  // Satu message dapat mempunyai beberapa jenis part:
  // - text
  // - tool-searchSpaces
  // - tool lainnya
  // - dll.
  // Karena itu kita mencari part khusus untuk tool:
  // `searchSpaces`.
    const searchTool = lastMessage.parts.find((part) => part.type === 'tool-searchSpaces');


  // ==========================================================
  // MEMERIKSA INPUT TOOL
  // ==========================================================
  // `searchTool` belum tentu ditemukan.
  // Kalau AI hanya menjawab menggunakan text biasa, maka tidak akan ada tool-searchSpaces.
  // Kita juga memeriksa apakah object tersebut mempunyai property `input`.
  // Ini membantu TypeScript memahami bahwa kita sedang berurusan dengan tool part yang memiliki input.
  // `input-available` berarti input/parameter untuk tool sudah tersedia. Misalnya AI menghasilkan:
  // {
  //   maxPrice: 300000,
  //   location: "Bandung"
  // }
      if (
      searchTool &&
      'input' in searchTool &&
      searchTool.state === 'input-available'
      ) {

    // ========================================================
    // KIRIM FILTER KE PARENT
    // ========================================================
    // `searchTool.input` berisi parameter yang dibuat oleh AI untuk tool `searchSpaces`. Contoh:

    // searchTool.input = {
    //   location: "Bandung",
    //   maxPrice: 300000
    // }

    // Kita kirim data tersebut ke parent menggunakan function `onFilterChange`.
    // Parent kemudian dapat menggunakan filter tersebut untuk memperbarui marker/data pada peta.
      onFilterChange(searchTool.input as Filters);
      }
  }, [messages, onFilterChange]);


  // ============================================================
  // HANDLE SUBMIT
  // ============================================================
  // Function ini dipanggil ketika user menekan tombol "Kirim" atau menekan Enter pada form.
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {

      // Mencegah browser melakukan reload halaman ketika form disubmit secara normal.
      e.preventDefault();

      // Jangan kirim pesan kosong. trim() menghapus spasi di awal/akhir. Contoh:
      // "     " akan dianggap kosong.
      if (!input.trim()) return;
    

  // ==========================================================
  // KIRIM PESAN KE AI
  // ==========================================================
  // AI SDK versi terbaru menggunakan sendMessage().text berisi pesan yang diketik user. Contoh:
  // input = "Cari coworking space di bawah 300 ribu"
  
  // maka:
  // sendMessage({
  //   text: "Cari coworking space di bawah 300 ribu"
  // });
    await sendMessage({
      text: input,
    });

  // Setelah pesan berhasil dikirim, kosongkan input agar siap digunakan kembali.
    setInput('');
  };


  // ============================================================
  // UI COMPONENT
  // ============================================================
  // Bagian ini adalah tampilan chat Copilot.
    return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col h-[500px]">


      {/* ========================================================
          HEADER COPILOT
          ======================================================== */}
      <div className="p-4 bg-gray-900 text-white rounded-t-xl font-bold flex justify-between items-center">

        {/* Judul aplikasi */}
        <span>✨ GeoConnect AI Copilot</span>

      </div>


      {/* ========================================================
          AREA PESAN CHAT
          ======================================================== */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">


        {/* ======================================================
            PESAN DEFAULT
            ======================================================

            Jika belum ada pesan sama sekali, tampilkan contoh pertanyaan agar user tahu apa yang bisa dilakukan.
        */}
        {messages.length === 0 && (
          <div className="text-gray-400 text-center text-sm mt-10">
            Ketik: "Cari coworking space di bawah 300 ribu dong!"
          </div>
        )}


        {/* ======================================================
            RENDER SEMUA PESAN
            ======================================================

            Kita melakukan loop terhadap semua messages. Setiap message bisa berasal dari:
            - user
            - assistant
        */}
        {messages.map((message) => (
          <div
            key={message.id}

            // Jika pesan berasal dari user, posisikan di sebelah kanan.
            // Jika pesan berasal dari assistant, posisikan di sebelah kiri.
            className={`flex ${ message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >

            {/* ==================================================
                CONTAINER PESAN
                ==================================================

                Setiap message mempunyai `parts`. Kita TIDAK menggunakan:

                message.content

                karena struktur message pada AI SDK terbaru menggunakan `parts`.
            */}
            <div
              className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-gray-100 text-gray-800 rounded-tl-none'
              }`}
            >


              {/* =================================================
                  RENDER MESSAGE PARTS
                  =================================================

                  Satu message bisa memiliki beberapa part.
                  Contohnya:

                  [
                    {
                      type: "text",
                      text: "Saya menemukan..."
                    },
                    {
                      type: "tool-searchSpaces",
                      ...
                    }
                  ]

                  Karena jenis part berbeda-beda, kita harus memeriksa `part.type`.
              */}
              {message.parts.map((part, index) => {
                // =================================================
                // TEXT PART
                // =================================================
                // Jika part adalah text biasa, tampilkan text tersebut. Contoh:
                // {
                //   type: "text",
                //   text: "Saya akan mencari coworking space..."
                // }
                if (part.type === 'text') {
                  return <span key={index}>{part.text}</span>
                }

                // =================================================
                // SEARCH SPACES TOOL
                // =================================================
                // Ini adalah tool yang kita definisikan di server. Misalnya di server:
                // tools: {
                //   searchSpaces: tool({
                //     ...
                //   })
                // }
                // Maka pada client AI SDK akan mengenalinya sebagai:
                // part.type === 'tool-searchSpaces'
                if (part.type === 'tool-searchSpaces') {
                  return (
                    <div
                      key={index}
                      className="mt-2 bg-green-50 text-green-700 text-xs p-2 rounded border border-green-200"
                    >
                      {/* ==========================================
                          TOOL SEDANG MENERIMA INPUT
                          ==========================================

                          `input-streaming` berarti AI masih menyusun/mengirim parameter untuk tool.
                          Contoh:
                          AI sedang menentukan:
                          - lokasi
                          - harga maksimum
                          - kategori
                      */}
                      {part.state === 'input-streaming' && (
                        <div>
                          ⚙️ AI sedang menyusun filter...
                        </div>
                      )}


                      {/* ==========================================
                          INPUT TOOL SUDAH TERSEDIA
                          ==========================================

                          `input-available` berarti parameter tool sudah tersedia.
                          Contoh:

                          {
                            location: "Bandung",
                            maxPrice: 300000
                          }

                          Kita tampilkan parameter tersebut agar user bisa melihat filter yang dibuat oleh AI.
                      */}
                      {part.state === 'input-available' && (
                        <div>

                          <div>
                            ⚙️ AI sedang memfilter properti
                            berdasarkan:
                          </div>

                          <pre className="mt-1 whitespace-pre-wrap">
                            {JSON.stringify(
                              part.input,
                              null,
                              2
                            )}
                          </pre>

                        </div>
                      )}


                      {/* ==========================================
                          TOOL SELESAI
                          ==========================================

                          `output-available` berarti tool sudah selesai dijalankan dan menghasilkan output.

                          Contoh output:

                          [
                            {
                              name: "CoHive Bandung",
                              price: 250000
                            }
                          ]

                          Jika nanti kita ingin menggunakan hasil pencarian tool, kita dapat membaca:

                          part.output
                      */}
                      {part.state === 'output-available' && (
                        <div>
                          ✅ Filter properti selesai.
                        </div>
                      )}


                      {/* ==========================================
                          TOOL ERROR
                          ==========================================

                          Jika tool gagal dijalankan, state dapat menjadi `output-error`.
                      */}
                      {part.state === 'output-error' && (
                        <div>
                          ❌ Gagal menjalankan filter.
                        </div>
                      )}

                    </div>
                  );
                }


        // =================================================
        // PART LAIN
        // =================================================
        // Tidak semua part harus ditampilkan.
        // Jika part bukan text atau searchSpaces, kita abaikan.
                return null;
              })}

            </div>

          </div>
        ))}

      </div>


      {/* ========================================================
          FORM INPUT CHAT
          ========================================================

          User mengetik pertanyaan di sini kemudian menekan tombol "Kirim".
      */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t flex gap-2"
      >


        {/* ======================================================
            INPUT USER
            ======================================================

            `value={input}`
            ----------------
            Nilai input dikontrol oleh React state.

            `onChange`
            ----------
            Setiap kali user mengetik, state `input` diperbarui.
        */}
        <input
          value={input}

          onChange={(e) => {
            setInput(e.target.value);
          }}

          placeholder="Tanya asisten AI..."

          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
    />


        {/* ======================================================
            BUTTON SUBMIT
            ======================================================

            Karena button berada di dalam <form> dan memiliki:
            type="submit"

            maka ketika diklik, function:
            handleSubmit() akan dipanggil.
        */}
        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded-lg font-bold text-sm"
        >
          Kirim
        </button>

      </form>

    </div>
  );
}


// ### Alur kode ini secara sederhana

// Sekarang alurnya menjadi:

// ```text
// User mengetik
//      │
//      ▼
// React state: input
//      │
//      ▼
// sendMessage({ text: input })
//      │
//      ▼
// AI menerima pertanyaan
//      │
//      ▼
// AI memutuskan menggunakan tool
// searchSpaces
//      │
//      ▼
// message.parts
//      │
//      ├── text
//      │
//      └── tool-searchSpaces
//              │
//              ▼
//        part.input
//              │
//              ▼
//        onFilterChange()
//              │
//              ▼
//        Parent / Map
//              │
//              ▼
//        Filter properti
// ```

// **Catatan penting:** `tool-searchSpaces` harus sesuai persis dengan nama tool yang Anda definisikan di server. Jadi kalau server Anda menggunakan `searchSpaces`, `part.type === 'tool-searchSpaces'` benar.

// Kalau Anda kirim juga kode **API route/server AI yang mendefinisikan `searchSpaces`**, saya bisa sesuaikan bagian `part.input`, `part.output`, dan `state` dengan struktur tool Anda supaya TypeScript-nya benar-benar type-safe.
