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
Object.defineProperty(exports, "__esModule", { value: true });
exports.diagnoseWebhookTimeout = diagnoseWebhookTimeout;
exports.updateTaskWithRetry = updateTaskWithRetry;
exports.batchUpdateTasks = batchUpdateTasks;
exports.suggestLongTermImprovements = suggestLongTermImprovements;
const integration_1 = require("./integration"); // updateTask is now exported
function diagnoseWebhookTimeout() {
    return [
        "Multiple simultaneous updates",
        "Slow response from TaskMaster",
        "Lack of asynchronous processing or retries",
    ];
}
function updateTaskWithRetry(taskId_1, updates_1, token_1) {
    return __awaiter(this, arguments, void 0, function* (taskId, updates, token, retries = 3) {
        for (let i = 1; i <= retries; i++) {
            try {
                yield (0, integration_1.updateTask)(taskId, updates, token);
                return;
            }
            catch (err) {
                if (i < retries) {
                    const delay = i * 2000;
                    yield new Promise((resolve) => setTimeout(resolve, delay));
                }
                else {
                    throw err;
                }
            }
        }
    });
}
function batchUpdateTasks(tasks_1, token_1) {
    return __awaiter(this, arguments, void 0, function* (tasks, token, batchSize = 5) {
        for (let i = 0; i < tasks.length; i += batchSize) {
            const batch = tasks.slice(i, i + batchSize);
            for (const t of batch) {
                yield updateTaskWithRetry(t.id, t.updates, token);
            }
        }
    });
}
function suggestLongTermImprovements() {
    return [
        "Async queues for bulk updates",
        "Better monitoring for timeouts",
        "Optimize TaskMaster API throughput",
    ];
}
