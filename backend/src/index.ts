import express from "express";
import cors from "cors";
import path from "path";
import routes from "./routes";

const app = express();

// Global Error Handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", routes);

// Serve Frontend (Static Files)
const frontendPath = path.join(__dirname, '../../frontend');
app.use(express.static(frontendPath));

// Catch-all for SPA (must be after API routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// IMPORTANT: start server for Render
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Serving frontend from: ${frontendPath}`);
});

