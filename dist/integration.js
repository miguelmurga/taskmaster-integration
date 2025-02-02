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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.integrationSpec = void 0;
exports.getAccessToken = getAccessToken;
exports.refreshAccessToken = refreshAccessToken;
exports.getNewTasks = getNewTasks;
exports.createTask = createTask;
exports.updateTask = updateTask;
const axios_1 = __importDefault(require("axios"));
const BASE_URL = "https://api.taskmaster.com";
function getAccessToken(authCode) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `${BASE_URL}/oauth/token`;
        const payload = {
            grant_type: "authorization_code",
            code: authCode,
            client_id: "YOUR_CLIENT_ID",
            client_secret: "YOUR_CLIENT_SECRET",
            redirect_uri: "YOUR_REDIRECT_URI",
        };
        const response = yield axios_1.default.post(url, payload);
        return response.data.access_token;
    });
}
function refreshAccessToken(refreshToken) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `${BASE_URL}/oauth/refresh`;
        const response = yield axios_1.default.get(url, {
            params: { refresh_token: refreshToken },
        });
        return response.data.access_token;
    });
}
function handleRateLimits(fn_1) {
    return __awaiter(this, arguments, void 0, function* (fn, retries = 3) {
        for (let i = 1; i <= retries; i++) {
            try {
                return yield fn();
            }
            catch (error) {
                const err = error;
                if (err.response && err.response.status === 429) {
                    const retryAfter = err.response.headers["retry-after"];
                    const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : i * 2000;
                    yield new Promise((resolve) => setTimeout(resolve, delay));
                }
                else {
                    throw error;
                }
            }
        }
        throw new Error("Rate limit retries exhausted.");
    });
}
function getNewTasks(lastTaskId_1) {
    return __awaiter(this, arguments, void 0, function* (lastTaskId, accessToken = "") {
        const url = `${BASE_URL}/tasks`;
        return handleRateLimits(() => __awaiter(this, void 0, void 0, function* () {
            const response = yield axios_1.default.get(url, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!lastTaskId)
                return response.data;
            return response.data.filter((t) => t.id > lastTaskId);
        }));
    });
}
function createTask(taskData_1) {
    return __awaiter(this, arguments, void 0, function* (taskData, accessToken = "") {
        const url = `${BASE_URL}/tasks`;
        return handleRateLimits(() => __awaiter(this, void 0, void 0, function* () {
            const response = yield axios_1.default.post(url, taskData, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            return response.data;
        }));
    });
}
// IMPORTANT: Export this so other files can import it
function updateTask(taskId_1, updates_1) {
    return __awaiter(this, arguments, void 0, function* (taskId, updates, accessToken = "") {
        const url = `${BASE_URL}/tasks/${taskId}`;
        return handleRateLimits(() => __awaiter(this, void 0, void 0, function* () {
            const response = yield axios_1.default.patch(url, updates, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            return response.data;
        }));
    });
}
// Export an integration spec object if you need it in server.ts
exports.integrationSpec = {
    triggers: {
        newTaskCreated: (lastTaskId_1, ...args_1) => __awaiter(void 0, [lastTaskId_1, ...args_1], void 0, function* (lastTaskId, token = "") { return getNewTasks(lastTaskId, token); }),
    },
    actions: {
        createTask: (taskData_1, ...args_1) => __awaiter(void 0, [taskData_1, ...args_1], void 0, function* (taskData, token = "") { return createTask(taskData, token); }),
        updateTask: (taskId_1, updates_1, ...args_1) => __awaiter(void 0, [taskId_1, updates_1, ...args_1], void 0, function* (taskId, updates, token = "") { return updateTask(taskId, updates, token); }),
    },
};
