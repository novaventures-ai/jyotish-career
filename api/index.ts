import express from "express";

const app = express();
app.use(express.json());

app.get("/api/test/simple", (req, res) => {
    res.json({
        status: "simple-ok",
        message: "This is a self-contained API function",
        timestamp: new Date().toISOString()
    });
});

// Fallback for any other /api route
app.all("/api*", (req, res) => {
    res.json({
        status: "api-fallback",
        path: req.path,
        timestamp: new Date().toISOString()
    });
});

export default app;
