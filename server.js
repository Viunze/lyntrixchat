import express from "express";
import cors from "cors";
import axios from "axios";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

// Konfigurasi Path untuk Vercel
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(cors());
app.use(express.json());

// Serving Static Files (Untuk production di Vercel, static files dihandle Vercel. 
// Ini hanya untuk local testing jika Anda ingin menjalankan server.js secara lokal.)
app.use(express.static(join(__dirname, 'src'))); 
app.use('/public', express.static(join(__dirname, 'public')));


// ========== PROXY OPENAI (ChatGPT) ===========
app.post("/api/openai", async (req, res) => {
  if (!process.env.OPENAI_KEY) {
      return res.status(500).json({ error: "OPENAI_KEY not set" });
  }
  try {
    const { message, system_prompt } = req.body;
    const result = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: system_prompt },
            { role: "user", content: message }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_KEY}`
        }
      }
    );
    res.json(result.data.choices[0].message.content);
  } catch (err) {
    console.error("OpenAI Error:", err.response ? err.response.data : err.message);
    res.status(500).json({ error: "OpenAI API failed" });
  }
});

// ========== PROXY GEMINI ===========
app.post("/api/gemini", async (req, res) => {
  if (!process.env.GEMINI_KEY) {
      return res.status(500).json({ error: "GEMINI_KEY not set" });
  }
  try {
    const { message, system_prompt } = req.body;
    
    const contents = [{ role: "user", parts: [{ text: system_prompt + "\n\n" + message }] }];

    const result = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_KEY}`,
      {
        contents: contents
      }
    );
    res.json(result.data.candidates[0].content.parts[0].text);
  } catch (err) {
    console.error("Gemini Error:", err.response ? err.response.data : err.message);
    res.status(500).json({ error: "Gemini API failed" });
  }
});

// ========== PROXY GROK (Menggunakan Placeholder Endpoint) ===========
// Karena endpoint GROK X.ai tidak tersedia publik, kita buat endpoint dummy.
app.post("/api/grok", async (req, res) => {
  if (!process.env.GROK_KEY) {
      // Menggunakan delay untuk simulasi response
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      
      const { message, system_prompt } = req.body;
      const dummyResponse = `Yo, ${system_prompt.match(/\[(\w+)\]/)[1]}! Gue Grok. Jadi, ${message.split(' ').slice(0, 3).join(' ')}? Santai, jangan serius amat. Mending ngopi.`;

      return res.json(dummyResponse);
  }
  
  try {
    const { message, system_prompt } = req.body;
    const result = await axios.post(
      "https://api.x.ai/v1/chat/completions", // Endpoint Grok yang sebenarnya
      {
        model: "grok-beta",
        messages: [
            { role: "system", content: system_prompt },
            { role: "user", content: message }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROK_KEY}`
        }
      }
    );
    res.json(result.data.choices[0].message.content);
  } catch (err) {
    console.error("Grok Error:", err.response ? err.response.data : err.message);
    res.status(500).json({ error: "Grok API failed" });
  }
});

// Handling request static files di root untuk Vercel
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'src', 'index.html'));
});

// Tambahkan catch-all handler untuk Vercel jika rute tidak cocok
app.get('/src/:file', (req, res) => {
    res.sendFile(join(__dirname, 'src', req.params.file));
});


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
