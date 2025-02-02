"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const integration_1 = require("./integration"); // Must match name & export
const webhookTimeout_1 = require("./webhookTimeout");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.get("/", (req, res) => {
    res.send("TaskMaster Integration");
});
app.get("/newTasks", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { lastTaskId, token } = req.query;
        const tasks = yield integration_1.integrationSpec.triggers.newTaskCreated(lastTaskId, token);
        res.json(tasks);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}));
app.post("/createTask", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const _a = req.body, { token } = _a, taskData = __rest(_a, ["token"]);
        const created = yield integration_1.integrationSpec.actions.createTask(taskData, token);
        res.json(created);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}));
app.post("/batchUpdate", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tasks, token } = req.body;
        yield (0, webhookTimeout_1.batchUpdateTasks)(tasks, token);
        res.json({ status: "Batch updated" });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}));
app.get("/diagnoseTimeout", (req, res) => {
    res.json((0, webhookTimeout_1.diagnoseWebhookTimeout)());
});
app.listen(3000, () => {
    console.log("Server is running at http://localhost:3000");
});
