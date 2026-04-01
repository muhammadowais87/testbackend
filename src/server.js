import dotenv from "dotenv";
import net from "node:net";
import { connectDB } from "./config/db.js";

dotenv.config();

const DEFAULT_PORT = Number(process.env.PORT) || 5000;
const MAX_PORT_ATTEMPTS = 20;
const HOST = process.env.HOST || "0.0.0.0";

const isPortAvailable = (port) => {
	return new Promise((resolve) => {
		const tester = net.createServer();

		tester.once("error", (error) => {
			if (error.code === "EADDRINUSE") {
				resolve(false);
				return;
			}

			resolve(false);
		});

		tester.once("listening", () => {
			tester.close(() => resolve(true));
		});

		tester.listen(port);
	});
};

const getAvailablePort = async (startPort) => {
	let port = startPort;

	for (let attempt = 0; attempt <= MAX_PORT_ATTEMPTS; attempt += 1) {
		const available = await isPortAvailable(port);
		if (available) {
			return port;
		}

		port += 1;
	}

	throw new Error(`No free port found from ${startPort} to ${startPort + MAX_PORT_ATTEMPTS}`);
};

const startServer = async () => {
	try {
		const { default: app } = await import("./app.js");
		await connectDB();

		// Cloud providers route traffic to the exact PORT they inject.
		const isCloudRuntime = process.env.NODE_ENV === "production" || Boolean(process.env.PORT);
		const port = isCloudRuntime ? DEFAULT_PORT : await getAvailablePort(DEFAULT_PORT);
		if (!isCloudRuntime && port !== DEFAULT_PORT) {
			console.warn(`Port ${DEFAULT_PORT} busy. Using port ${port} instead.`);
		}

		app.listen(port, HOST, () => {
			console.log(`Backend server running on ${HOST}:${port}`);
		});
	} catch (error) {
		console.error("Server failed to start:", error.message);
		process.exit(1);
	}
};

startServer();
