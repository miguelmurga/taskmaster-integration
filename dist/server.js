"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
// ✅ Fix: Define middleware separately and pass it to `app.use()`
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or invalid authorization token" });
    }
    req.body.token = authHeader.split(" ")[1];
    next();
};
app.use(authMiddleware); // ✅ Correct way to register middleware
// ✅ Fix: Error Handling Middleware should be last
app.use((err, req, res, next) => {
    console.error("Error:", err);
    res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
