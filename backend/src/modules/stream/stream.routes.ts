import { Router } from "express";
import { StreamController } from "./stream.controller.js";

export const streamRouter = Router();

// Streaming endpoints use dedicated signed stream tokens with CORS enabled
streamRouter.get("/:token/:channelId/index.m3u8", StreamController.getManifest);
streamRouter.get("/:token/:channelId/chunk", StreamController.getChunk);
