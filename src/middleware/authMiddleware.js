import jwt from "jsonwebtoken";

const getBearerToken = (authHeader = "") => {
  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.split(" ")[1];
};

export const protectTeacher = (req, res, next) => {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({ message: "Not authorized, token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_jwt_secret");
    if (decoded.role !== "teacher") {
      return res.status(403).json({ message: "Not authorized for teacher access" });
    }

    req.teacher = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, token invalid" });
  }
};

export const protectSubUser = (req, res, next) => {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({ message: "Not authorized, token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_jwt_secret");
    if (decoded.role !== "sub-user") {
      return res.status(403).json({ message: "Not authorized for sub user access" });
    }

    req.subUser = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
      instituteId: decoded.instituteId,
      instituteName: decoded.instituteName,
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, token invalid" });
  }
};

export const protectInstitute = (req, res, next) => {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({ message: "Not authorized, token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_jwt_secret");
    if (decoded.role !== "institute") {
      return res.status(403).json({ message: "Not authorized for institute access" });
    }

    req.institute = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
      schoolId: decoded.schoolId,
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, token invalid" });
  }
};

export const protectAnyPortal = (req, res, next) => {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({ message: "Not authorized, token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_jwt_secret");
    const role = decoded.role;

    if (!["institute", "teacher", "sub-user"].includes(role)) {
      return res.status(403).json({ message: "Not authorized for this resource" });
    }

    req.portalUser = {
      id: decoded.id,
      role,
      email: decoded.email,
      schoolId: decoded.schoolId,
      instituteId: decoded.instituteId,
      instituteName: decoded.instituteName,
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, token invalid" });
  }
};
