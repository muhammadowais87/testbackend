import cors from "cors";
import express from "express";
import instituteAuthRoutes from "./routes/instituteAuthRoutes.js";
import queryRoutes from "./routes/queryRoutes.js";
import schoolRoutes from "./routes/schoolRoutes.js";
import teacherAuthRoutes from "./routes/teacherAuthRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";

const app = express();

const envOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const defaultOrigins = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://examsync-u44w.vercel.app",
];

const allowedOrigins = new Set([...defaultOrigins, ...envOrigins]);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin tools/non-browser clients that do not send an Origin header.
      if (!origin) {
        callback(null, true);
        return;
      }

      const isVercelDeployment = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);

      if (allowedOrigins.has(origin) || isVercelDeployment) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "ExamSync backend is running",
    health: "/api/health",
  });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/teacher-auth", teacherAuthRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/institute-auth", instituteAuthRoutes);
app.use("/api/schools", schoolRoutes);
app.use("/api/queries", queryRoutes);

export default app;
