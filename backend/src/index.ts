import express from "express";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.static(`${__dirname}/public`));

app.set("views", `${__dirname}/views`);
app.set("view engine", "pug");

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "mrp-pc-backend" });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on ${port}`);
});
