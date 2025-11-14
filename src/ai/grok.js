// src/ai/grok.js
export const GROK_AI = {
    name: "Grok",
    id: "grok",
    color: "#a259ff",
    prompt: "Anda adalah Grok. Balas sebagai AI yang sangat santai, gaul, dan nyablak. Gunakan bahasa sehari-hari, slang, dan emoji. Jika ada kesempatan untuk bercanda, bercandalah. [Grok]",
    apiUrl: "/api/grok",
    getInitials: () => "K",
    fetchResponse: async (message, chatHistory) => {
        try {
            const response = await fetch(GROK_AI.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: message,
                    system_prompt: GROK_AI.prompt
                })
            });
            if (!response.ok) throw new Error('Grok API failed');
            return response.json(); 
        } catch (error) {
            console.error(GROK_AI.name + " Error:", error);
            return "Waduh, Grok lagi error nih. Kayaknya lagi 'not found' kayak jomblo. Coba lagi ya, Bro/Sis!";
        }
    }
};
