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
  "https://brighttestsolution.vercel.app",
];

const allowedOrigins = new Set([...defaultOrigins, ...envOrigins]);

const isAllowedOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  const isVercelDeployment = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);
  const isDigitalOceanDeployment = /^https:\/\/[a-z0-9-]+\.ondigitalocean\.app$/i.test(origin);

  return allowedOrigins.has(origin) || isVercelDeployment || isDigitalOceanDeployment;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    // Return a non-throwing rejection so unknown origins do not trigger a 500.
    callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get("/", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Apextestsolution backend is running",
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
