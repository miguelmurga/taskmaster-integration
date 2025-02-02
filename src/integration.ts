import axios, { type AxiosResponse, type AxiosError } from "axios";

const BASE_URL = "http://localhost:3000";

export async function getAccessToken(authCode: string): Promise<string> {
    const url = `${BASE_URL}/oauth/token`;
    const payload = {
        grant_type: "authorization_code",
        code: authCode,
        client_id: "YOUR_CLIENT_ID",
        client_secret: "YOUR_CLIENT_SECRET",
        redirect_uri: "YOUR_REDIRECT_URI",
    };
    const response: AxiosResponse<{ access_token: string }> = await axios.post(url, payload);
    return response.data.access_token;
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
    const url = `${BASE_URL}/oauth/refresh`;
    const response: AxiosResponse<{ access_token: string }> = await axios.get(url, {
        params: { refresh_token: refreshToken },
    });
    return response.data.access_token;
}

async function handleRateLimits<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
    for (let i = 1; i <= retries; i++) {
        try {
            return await fn();
        } catch (error) {
            const err = error as AxiosError;
            if (err.response && err.response.status === 429) {
                const retryAfter = err.response.headers["retry-after"];
                const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : i * 2000;
                await new Promise((resolve) => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }
    throw new Error("Rate limit retries exhausted.");
}

export async function getNewTasks(lastTaskId?: string, accessToken = ""): Promise<any[]> {
    const url = `${BASE_URL}/tasks`;
    return handleRateLimits(async () => {
        const response: AxiosResponse<any[]> = await axios.get(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!lastTaskId) return response.data;
        return response.data.filter((t: any) => t.id > lastTaskId);
    });
}

export async function createTask(
    taskData: { title: string; description: string },
    accessToken = ""
): Promise<any> {
    const url = `${BASE_URL}/tasks`;
    return handleRateLimits(async () => {
        const response: AxiosResponse<any> = await axios.post(url, taskData, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        return response.data;
    });
}

// IMPORTANT: Export this so other files can import it
export async function updateTask(
    taskId: string,
    updates: { title?: string; description?: string },
    accessToken = ""
): Promise<any> {
    const url = `${BASE_URL}/tasks/${taskId}`;
    return handleRateLimits(async () => {
        const response: AxiosResponse<any> = await axios.patch(url, updates, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        return response.data;
    });
}

// Export an integration spec object if you need it in server.ts
export const integrationSpec = {
    triggers: {
        newTaskCreated: async (lastTaskId?: string, token = "") => getNewTasks(lastTaskId, token),
    },
    actions: {
        createTask: async (taskData: { title: string; description: string }, token = "") =>
            createTask(taskData, token),
        updateTask: async (
            taskId: string,
            updates: { title?: string; description?: string },
            token = ""
        ) => updateTask(taskId, updates, token),
    },
};