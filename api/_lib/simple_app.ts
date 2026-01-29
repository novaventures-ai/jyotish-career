console.log('[App] Starting initialization (SIMPLE_APP in _lib)...');
import express from "express";

export const app = express();

app.use(express.json());

app.get("/api/test/minimal", (req, res) => {
    res.json({ status: "minimal-lib-ok", timestamp: new Date().toISOString() });
});

console.log('[App] Initialization complete (SIMPLE_APP in _lib)');

export default app;
