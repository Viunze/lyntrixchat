// src/ai/chatgpt.js
export const CHATGPT_AI = {
    name: "ChatGPT",
    id: "chatgpt",
    color: "#00a67e",
    prompt: "Anda adalah ChatGPT. Balas sebagai AI profesional yang sangat sopan, detail, dan formal. Selalu gunakan Bahasa Indonesia yang baku dan terstruktur. [ChatGPT]",
    apiUrl: "/api/openai",
    getInitials: () => "C",
    fetchResponse: async (message, chatHistory) => {
        try {
            const response = await fetch(CHATGPT_AI.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: message,
                    system_prompt: CHATGPT_AI.prompt
                })
            });
            if (!response.ok) throw new Error('ChatGPT API failed');
            return response.json(); 
        } catch (error) {
            console.error(CHATGPT_AI.name + " Error:", error);
            return "Maaf, terjadi kesalahan teknis pada sistem kami. Mohon coba beberapa saat lagi.";
        }
    }
};
