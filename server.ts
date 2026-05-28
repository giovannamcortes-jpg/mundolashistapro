import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: "20mb" })); // Increase limit for larger backups

  const DATA_FILE = path.join(process.cwd(), "db.json");

  // Load database data automatically
  app.get("/api/load-data", (req, res) => {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const fileContent = fs.readFileSync(DATA_FILE, "utf-8");
        const json = JSON.parse(fileContent || "{}");
        return res.json(json);
      }
      return res.json({});
    } catch (err) {
      console.error("Error loading db.json:", err);
      return res.status(500).json({ error: "Failed to load system database" });
    }
  });

  // Save database changes automatically
  app.post("/api/save-data", (req, res) => {
    try {
      const data = req.body;
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
      return res.json({ success: true, timestamp: new Date().toISOString() });
    } catch (err) {
      console.error("Error saving to db.json:", err);
      return res.status(500).json({ error: "Failed to persist database changes" });
    }
  });

  // API Support Chatbot with AI 24/7
  app.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Mensaje es requerido" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({
          text: `🤖 **[Asistente IA - Soporte 24/7 Demo]**\n\n¡Hola! Soy tu asistente inteligente de soporte de **Mundo Lashista Pro**.\n\nEn este momento, la aplicación se encuentra en modo demostración local, pero puedo ayudarte con lo siguiente:\n\n1. **Fichas de Lashistas**: En el panel de control, ahora puedes hacer clic sobre cualquier lashista para ver su **ficha extendida**, editar toda su información y gestionar contratos, facturas u hojas de consentimiento en su **Gestor de Documentos**.\n2. **Módulos del Sistema**: Gestiona el Asistente de Reservas de Whatsapp (Agenda Pro), las campañas de fidelización para recuperar clientes dormidos, y el Sistema Viral de recomendación.\n3. **Cuentas y Membresías**: Cambia el plan del salón entre Básico ($29 USD), Pro ($49 USD), o Trial de Prueba (7 días).\n\n¿Tienes alguna duda de cómo subir documentos o simular una reserva? ¡Pregúntame!`
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const chatInstance = ai.chats.create({
        model: "gemini-3.5-flash",
        config: {
          systemInstruction: `Eres "Soporte 24/7 Mundo Lashista Pro", un asistente conversacional experto con IA súper carismático y profesional.
Ayudas a administradores y lashistas a operar la plataforma de gestión, agenda y fidelización para profesionales de la belleza lashista.
Tus capacidades clave son:
- Dar consejos sobre cómo agendar citas, personalizar horarios de trabajo y usar los enlaces de reserva para clientes.
- Explicar las ventajas del plan Premium (Pro, Básico y Trial).
- Explicar el nuevo Gestor de Documentos de Lashistas en el panel de Admin, donde los directores del salón pueden guardar contratos digitales de adhesión, facturas de pago, y fichas de historial clínico.
- Resolver dudas generales sobre lashistas, lifting, volumen ruso y diseño de cejas.
Responde de forma amigable, directa y profesional en idioma español. Utiliza emojis sutilmente y formato markdown para estructurar los pasos.`
        }
      });

      const response = await chatInstance.sendMessage({ message });
      res.json({ text: response.text });
    } catch (err: any) {
      console.error("Gemini API Error:", err);
      res.status(500).json({ error: "Ocurrió un error al procesar tu solicitud de chat con el bot de soporte." });
    }
  });

  // Serve static files in development or production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
