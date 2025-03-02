const { Queue } = require("bullmq");
const imageQueue = new Queue("imageProcessing", { connection: { host: "localhost", port: 6379 } });

async function addJobToQueue(requestId, filePath) {
    await imageQueue.add("processImages", { requestId, filePath });
}

module.exports = { addJobToQueue };
