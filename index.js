const express = require("express");
const cors = require("cors");
const app = express();

const authRoutes = require("./routes/auth");

const allowedOrigins = [
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "https://localhost:3443",
  "http://localhost:8080"
];

const corsOptions = {
  origin: function (origin, callback) {
    // Erlaube Requests ohne origin (z.B. Postman) oder wenn origin in allowedOrigins ist
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Nicht erlaubter Ursprung: " + origin));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
