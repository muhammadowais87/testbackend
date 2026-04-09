import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import QuestionBankChapter from "../models/QuestionBankChapter.js";

dotenv.config();

const chapterGroups = [
  {
    name: "CHAP 1: Introduction to Programming",
    chapters: [
      "1.1 Programming Environment",
      "1.2 Programming Basics",
      "1.3 Constant and Variables",
      "1.01 Past Multiple choice question",
    ],
  },
  {
    name: "CHAP 2: User Interface",
    chapters: [
      "2.1 Input / Output (I/O) Function",
      "2.2 Operators",
      "2.01 Past Multiple choice question",
    ],
  },
  {
    name: "CHAP 3: Conditional Logic",
    chapters: [
      "3.1 Control Statments",
      "3.2 Selection Statements",
    ],
  },
  {
    name: "CHAP 4: Data and Repetition",
    chapters: [
      "4.1 Data Structure",
      "4.2 Loop Structures",
    ],
  },
  {
    name: "CHAP 5: Functions",
    chapters: [
      "5.1 Functions",
    ],
  },
];

const run = async () => {
  try {
    await connectDB();

    await QuestionBankChapter.updateOne(
      { syllabusKey: "Computer-10TH-PTB" },
      {
        $set: {
          syllabusKey: "Computer-10TH-PTB",
          subject: "Computer",
          className: "10TH",
          board: "PTB",
          groups: chapterGroups,
        },
      },
      { upsert: true }
    );
    console.log("Question bank chapters seed complete");
    console.log("Question bank question data is expected to already exist in DB.");

    process.exit(0);
  } catch (error) {
    console.error("Question bank seed failed:", error.message);
    process.exit(1);
  }
};

run();
