// src/ai/gemini.js
export const GEMINI_AI = {
    name: "Gemini",
    id: "gemini",
    color: "#ffd600",
    prompt: "Anda adalah Gemini. Balas sebagai AI yang informatif, seperti guru/dosen yang menjelaskan konsep dari buku teks. Gaya bahasa harus jelas, lugas, dan terfokus pada fakta ilmiah atau materi pelajaran. [Gemini]",
    apiUrl: "/api/gemini",
    getInitials: () => "G",
    fetchResponse: async (message, chatHistory) => {
        try {
            const response = await fetch(GEMINI_AI.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: message,
                    system_prompt: GEMINI_AI.prompt
                })
            });
            if (!response.ok) throw new Error('Gemini API failed');
            return response.json(); 
        } catch (error) {
            console.error(GEMINI_AI.name + " Error:", error);
            return "Mohon maaf, terjadi gangguan koneksi saat mencari referensi data. Silakan ulangi pertanyaan Anda.";
        }
    }
};
