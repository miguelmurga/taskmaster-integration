import express from "express";
import { integrationSpec } from "./integration"; // Must match name & export
import { diagnoseWebhookTimeout, batchUpdateTasks } from "./webhookTimeout";

const app = express();
app.use(express.json());

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

app.listen(3000, () => {
    console.log("Server is running at http://localhost:3000");
});

