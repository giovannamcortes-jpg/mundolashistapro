var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_fs = __toESM(require("fs"), 1);
import_dotenv.default.config();
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server en puerto ${PORT}`));
  const DATA_FILE = import_path.default.join(process.cwd(), "db.json");
  app.get("/api/load-data", (req, res) => {
    try {
      if (import_fs.default.existsSync(DATA_FILE)) {
        const fileContent = import_fs.default.readFileSync(DATA_FILE, "utf-8");
        const json = JSON.parse(fileContent || "{}");
        return res.json(json);
      }
      return res.json({});
    } catch (err) {
      console.error("Error loading db.json:", err);
      return res.status(500).json({ error: "Failed to load system database" });
    }
  });
  app.post("/api/save-data", (req, res) => {
    try {
      const data = req.body;
      import_fs.default.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
      return res.json({ success: true, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
    } catch (err) {
      console.error("Error saving to db.json:", err);
      return res.status(500).json({ error: "Failed to persist database changes" });
    }
  });
  app.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Mensaje es requerido" });
      }
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({
          text: `\u{1F916} **[Asistente IA - Soporte 24/7 Demo]**

\xA1Hola! Soy tu asistente inteligente de soporte de **Mundo Lashista Pro**.

En este momento, la aplicaci\xF3n se encuentra en modo demostraci\xF3n local, pero puedo ayudarte con lo siguiente:

1. **Fichas de Lashistas**: En el panel de control, ahora puedes hacer clic sobre cualquier lashista para ver su **ficha extendida**, editar toda su informaci\xF3n y gestionar contratos, facturas u hojas de consentimiento en su **Gestor de Documentos**.
2. **M\xF3dulos del Sistema**: Gestiona el Asistente de Reservas de Whatsapp (Agenda Pro), las campa\xF1as de fidelizaci\xF3n para recuperar clientes dormidos, y el Sistema Viral de recomendaci\xF3n.
3. **Cuentas y Membres\xEDas**: Cambia el plan del sal\xF3n entre B\xE1sico ($29 USD), Pro ($49 USD), o Trial de Prueba (7 d\xEDas).

\xBFTienes alguna duda de c\xF3mo subir documentos o simular una reserva? \xA1Preg\xFAntame!`
        });
      }
      const ai = new import_genai.GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const chatInstance = ai.chats.create({
        model: "gemini-3.5-flash",
        config: {
          systemInstruction: `Eres "Soporte 24/7 Mundo Lashista Pro", un asistente conversacional experto con IA s\xFAper carism\xE1tico y profesional.
Ayudas a administradores y lashistas a operar la plataforma de gesti\xF3n, agenda y fidelizaci\xF3n para profesionales de la belleza lashista.
Tus capacidades clave son:
- Dar consejos sobre c\xF3mo agendar citas, personalizar horarios de trabajo y usar los enlaces de reserva para clientes.
- Explicar las ventajas del plan Premium (Pro, B\xE1sico y Trial).
- Explicar el nuevo Gestor de Documentos de Lashistas en el panel de Admin, donde los directores del sal\xF3n pueden guardar contratos digitales de adhesi\xF3n, facturas de pago, y fichas de historial cl\xEDnico.
- Resolver dudas generales sobre lashistas, lifting, volumen ruso y dise\xF1o de cejas.
Responde de forma amigable, directa y profesional en idioma espa\xF1ol. Utiliza emojis sutilmente y formato markdown para estructurar los pasos.`
        }
      });
      const response = await chatInstance.sendMessage({ message });
      res.json({ text: response.text });
    } catch (err) {
      console.error("Gemini API Error:", err);
      res.status(500).json({ error: "Ocurri\xF3 un error al procesar tu solicitud de chat con el bot de soporte." });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
