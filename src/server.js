import dotenv from "dotenv";
import net from "node:net";
import app from "./app.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const DEFAULT_PORT = Number(process.env.PORT) || 5000;
const MAX_PORT_ATTEMPTS = 20;

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
		await connectDB();
		const port = await getAvailablePort(DEFAULT_PORT);
		if (port !== DEFAULT_PORT) {
			console.warn(`Port ${DEFAULT_PORT} busy. Using port ${port} instead.`);
		}

		app.listen(port, () => {
			console.log(`Backend server running on port ${port}`);
		});
	} catch (error) {
		console.error("Server failed to start:", error.message);
		process.exit(1);
	}
};

startServer();
