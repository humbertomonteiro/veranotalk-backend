import express from "express";

import {
  userRoutes,
  participantRoutes,
  checkoutRoutes,
  couponRoutes,
} from "./infrastructure/routes";

import cors from "cors";
import { config } from "dotenv";
config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/users", userRoutes);
app.use("/participant", participantRoutes);
app.use("/webhook", checkoutRoutes);
app.use("/coupons", couponRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
