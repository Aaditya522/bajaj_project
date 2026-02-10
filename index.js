import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const EMAIL = process.env.OFFICIAL_EMAIL;


const fibonacci = (n) => {
  if (n <= 0) return [];
  const res = [0, 1];
  for (let i = 2; i < n; i++) {
    res.push(res[i - 1] + res[i - 2]);
  }
  return res.slice(0, n);
};

const isPrime = (n) => {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
};

const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));

const hcf = (arr) => arr.reduce((a, b) => gcd(a, b));

const lcm = (arr) =>
  arr.reduce((a, b) => (a * b) / gcd(a, b));

// GET /health
app.get("/health", (req, res) => {
  res.status(200).json({
    is_success: true,
    official_email: EMAIL
  });
});

// POST /bfhl
app.post("/bfhl", async (req, res) => {
  try {
    const body = req.body;
    const keys = Object.keys(body);

    if (keys.length !== 1) {
      return res.status(400).json({
        is_success: false,
        official_email: EMAIL,
        error: "Exactly one key is required"
      });
    }

    const key = keys[0];
    let data;

    switch (key) {
      case "fibonacci":
        if (!Number.isInteger(body[key]) || body[key] < 0) {
          throw new Error("Invalid fibonacci input");
        }
        data = fibonacci(body[key]);
        break;

      case "prime":
        if (!Array.isArray(body[key])) {
          throw new Error("Prime expects integer array");
        }
        data = body[key].filter(
          (n) => Number.isInteger(n) && isPrime(n)
        );
        break;

      case "lcm":
        if (!Array.isArray(body[key]) || body[key].length === 0) {
          throw new Error("LCM expects non-empty array");
        }
        data = lcm(body[key]);
        break;

      case "hcf":
        if (!Array.isArray(body[key]) || body[key].length === 0) {
          throw new Error("HCF expects non-empty array");
        }
        data = hcf(body[key]);
        break;

      case "AI":
        if (typeof body[key] !== "string") {
          throw new Error("AI expects a string question");
        }

        const aiRes = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            contents: [{ parts: [{ text: body[key] }] }]
          }
        );

        data =
          aiRes.data.candidates?.[0]?.content?.parts?.[0]?.text
            ?.split(" ")[0] || "Unknown";
        break;

      default:
        return res.status(400).json({
          is_success: false,
          official_email: EMAIL,
          error: "Invalid key"
        });
    }

    res.status(200).json({
      is_success: true,
      official_email: EMAIL,
      data
    });

  } catch (err) {
    res.status(500).json({
      is_success: false,
      official_email: EMAIL,
      error: err.message
    });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
