/**
 * TaskMaster Integration Boilerplate
 * Instructions: Complete the functions below to implement the integration spec
 * for the fictional "TaskMaster" app. Follow the comments for guidance.
 * Implement the OAuth authentication flow by completing the getAccessToken and refreshAccessToken functions.
 * Complete the getNewTasks, createTask, and updateTask functions for the triggers and actions.
 * Use the handleRateLimits function to gracefully handle rate-limiting errors (status 429).
 * Test your implementation by simulating API interactions with mock data or a test server.
 */

import axios, { type AxiosResponse, type AxiosError } from "axios";

// Base URL for TaskMaster API
// For testing purposes, we use a local server. Replace with "https://api.taskmaster.com" in production.
const BASE_URL = "http://localhost:3000";

// --- OAuth 2.0 Authentication ---

/**
 * Function to exchange authorization code for an access token.
 * @param authCode - The authorization code received from the OAuth process.
 * @returns The access token from the response.
 */
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

/**
 * Function to refresh the access token using a refresh token.
 * @param refreshToken - The refresh token received during initial authentication.
 * @returns The new access token.
 */
export async function refreshAccessToken(refreshToken: string): Promise<string> {
    const url = `${BASE_URL}/oauth/refresh`;
    const response: AxiosResponse<{ access_token: string }> = await axios.get(url, {
        params: { refresh_token: refreshToken },
    });
    return response.data.access_token;
}

// --- Rate Limit Handling ---

/**
 * Helper function to handle rate limits.
 * Automatically retries the request after the specified delay when a 429 status is encountered.
 * @param fn - The function making the API request.
 * @param retries - Number of retries allowed (default: 3).
 * @returns The response from the API call.
 */
async function handleRateLimits<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            const err = error as AxiosError;
            if (err.response && err.response.status === 429) {
                const retryAfter = err.response.headers["retry-after"];
                const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : attempt * 2000; // Exponential backoff delay.
                console.warn(`Rate limit hit. Retrying after ${delay}ms...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }
    throw new Error("Rate limit retries exhausted.");
}

// --- Triggers ---

/**
 * Function to simulate polling for new tasks.
 * @param lastTaskId - The ID of the last task processed (if any).
 * @param accessToken - The access token for authentication.
 * @returns An array of new tasks since the lastTaskId.
 */
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

// --- Actions ---

/**
 * Function to create a new task.
 * @param taskData - The data for the new task to be created.
 * @param accessToken - The access token for authentication.
 * @returns The created task object.
 */
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

/**
 * Function to update an existing task.
 * @param taskId - The ID of the task to update.
 * @param updates - The data to update the task with.
 * @param accessToken - The access token for authentication.
 * @returns The updated task object.
 */
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

// --- Main Integration Spec ---

/**
 * Integration Spec Definition
 * Use this section to describe the structure of the integration, including authentication,
 * triggers, actions, and rate limit handling.
 */
export const integrationSpec = {
    authentication: {
        type: "OAuth2",
        endpoints: {
            token: `${BASE_URL}/oauth/token`,
            refresh: `${BASE_URL}/oauth/refresh`,
        },
        // Expose the OAuth functions for external use
        getAccessToken,
        refreshAccessToken,
    },
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

export default integrationSpec;
