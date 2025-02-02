import { updateTask } from "./integration";

export function diagnoseWebhookTimeout(): string[] {
    return [
        "Multiple simultaneous updates",
        "Slow response from TaskMaster",
        "Lack of asynchronous processing or retries",
    ];
}

export async function updateTaskWithRetry(
    taskId: string,
    updates: any,
    token: string,
    retries = 3
) {
    for (let i = 1; i <= retries; i++) {
        try {
            await updateTask(taskId, updates, token);
            return;
        } catch (err) {
            if (i < retries) {
                const delay = i * 2000;
                await new Promise((resolve) => setTimeout(resolve, delay));
            } else {
                throw err;
            }
        }
    }
}

export async function batchUpdateTasks(
    tasks: { id: string; updates: any }[],
    token: string,
    batchSize = 5
) {
    for (let i = 0; i < tasks.length; i += batchSize) {
        const batch = tasks.slice(i, i + batchSize);
        for (const t of batch) {
            await updateTaskWithRetry(t.id, t.updates, token);
        }
    }
}

export function suggestLongTermImprovements(): string[] {
    return [
        "Asynchronous queues for bulk updates",
        "Improved timeout monitoring",
        "Optimized TaskMaster API throughput",
    ];
}
