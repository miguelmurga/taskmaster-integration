import express from "express";
import { integrationSpec } from "./integration";
import { diagnoseWebhookTimeout, batchUpdateTasks } from "./webhookTimeout";

const app = express();
app.use(express.json());

// --- OAuth 2.0 Simulation ---
app.post("/oauth/token", (req, res) => {
    res.json({
        access_token: "test-token-123",
        expires_in: 3600
    });
});

app.get("/", (req, res) => {
    res.send("TaskMaster Integration");
});

app.get("/newTasks", async (req, res) => {
    try {
        const { lastTaskId, token } = req.query;
        const tasks = await integrationSpec.triggers.newTaskCreated(lastTaskId as string, token as string);
        res.json(tasks);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/createTask", async (req, res) => {
    try {
        const { token, ...taskData } = req.body;
        const created = await integrationSpec.actions.createTask(taskData, token);
        res.json(created);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/batchUpdate", async (req, res) => {
    try {
        const { tasks, token } = req.body;
        await batchUpdateTasks(tasks, token);
        res.json({ status: "Batch updated" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/diagnoseTimeout", (req, res) => {
    res.json(diagnoseWebhookTimeout());
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});

// Middleware to log requests
app.use((req, res, next) => {
    console.log(`Request received: ${req.method} ${req.url}`);
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    next();
});

// Mock endpoint to simulate TaskMaster API
app.get("/tasks", (req, res) => {
    res.json([
        { id: "1", title: "Task 1", description: "Description of task 1" },
        { id: "2", title: "Task 2", description: "Description of task 2" }
    ]);
});
