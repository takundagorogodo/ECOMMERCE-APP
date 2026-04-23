import app from "./app.js";

const PORT = process.env.PORT || 5000;  // was missing — PORT is undefined here

process.on("uncaughtException", (err) => {
      console.error("UncaughtException", err);
      process.exit(1);
});

const server = app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);  // missing colon
});

process.on("unhandledRejection", (reason) => {
      console.error("UnhandledRejection", reason);
      server.close(() => {
            process.exit(1);
      });
});