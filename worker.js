const { Worker } = require("bullmq");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const sharp = require("sharp");
const { db } = require("./database");

const imageWorker = new Worker("imageProcessing", async (job) => {
    const { requestId, filePath } = job.data;
    const outputDir = "processed_images";
    fs.mkdirSync(outputDir, { recursive: true });

    const csv = fs.readFileSync(filePath, "utf8");
    const lines = csv.split("\n").slice(1); // Skip header

    const outputData = ["Serial Number,Product Name,Input Image Urls,Output Image Urls"];

    for (const line of lines) {
        if (!line.trim()) continue;
        const [serial, product, inputUrls] = line.split(",");

        const outputUrls = [];
        for (const url of inputUrls.split(";")) {
            try {
                const imageResponse = await axios.get(url.trim(), { responseType: "arraybuffer" });
                const imageBuffer = Buffer.from(imageResponse.data);
                const outputFile = path.join(outputDir, `${requestId}_${serial}.jpg`);

                await sharp(imageBuffer).jpeg({ quality: 50 }).toFile(outputFile);
                outputUrls.push(outputFile);
            } catch (err) {
                console.error(`Failed to process ${url}`, err);
            }
        }

        outputData.push(`${serial},${product},${inputUrls},"${outputUrls.join(";")}"`);
    }

    const outputCSV = path.join(outputDir, `${requestId}_output.csv`);
    fs.writeFileSync(outputCSV, outputData.join("\n"));

    db.query("UPDATE requests SET status = ?, output_csv = ? WHERE request_id = ?", ["Completed", outputCSV, requestId]);
});

console.log("Worker started...");
