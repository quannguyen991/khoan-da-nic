import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import backendModule from "./backend/server.js";

async function startServer() {
  const app = express();
  /**
   * ⚠️ ĐỌC `PORT` TỪ MÔI TRƯỜNG, ĐỪNG GHIM 3000.
   * Ghim một số cố định thì máy nào đang chạy thứ khác ở cổng đó là bản dựng
   * chết ngay lúc khởi động, kèm một dòng `EADDRINUSE` mà người không quen đọc
   * sẽ tưởng app hỏng.
   */
  const PORT = Number(process.env.PORT) || 3000;

  // Mount backend routes
  app.use(backendModule.app);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
