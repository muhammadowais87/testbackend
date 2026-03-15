import Query from "../models/Query.js";

const clean = (value) => (typeof value === "string" ? value.trim() : "");

export const createQuery = async (req, res) => {
  try {
    const name = clean(req.body?.name);
    const email = clean(req.body?.email).toLowerCase();
    const phone = clean(req.body?.phone);
    const school = clean(req.body?.school);
    const queryType = clean(req.body?.queryType);
    const message = clean(req.body?.message);

    if (!name || !phone || !queryType || !message) {
      return res.status(400).json({ message: "Name, phone, query type, and message are required" });
    }

    const query = await Query.create({
      name,
      email,
      phone,
      school,
      queryType,
      message,
    });

    return res.status(201).json({
      message: "Query submitted successfully",
      query,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to submit query", error: error.message });
  }
};

export const getQueries = async (_req, res) => {
  try {
    const queries = await Query.find().sort({ createdAt: -1 });
    return res.status(200).json({ queries });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch queries", error: error.message });
  }
};

export const markQueryAsRead = async (req, res) => {
  try {
    const query = await Query.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    if (!query) {
      return res.status(404).json({ message: "Query not found" });
    }

    return res.status(200).json({ message: "Query marked as read", query });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update query", error: error.message });
  }
};

export const deleteQuery = async (req, res) => {
  try {
    const query = await Query.findByIdAndDelete(req.params.id);

    if (!query) {
      return res.status(404).json({ message: "Query not found" });
    }

    return res.status(200).json({ message: "Query deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete query", error: error.message });
  }
};
