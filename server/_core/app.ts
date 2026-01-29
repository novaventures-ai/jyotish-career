console.log('[App] Starting initialization (MINIMAL)...');
import express from "express";

export const app = express();

app.use(express.json());

app.get("/api/test/minimal", (req, res) => {
    res.json({ status: "minimal-ok", timestamp: new Date().toISOString() });
});

console.log('[App] Initialization complete (MINIMAL)');

export default app;
