import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is not configured");
}

export const redisClient = createClient({
  url: redisUrl,
});

redisClient.on("error", (error) => {
  console.error("Redis error:", error);
});

export const connectRedis = async (): Promise<void> => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    console.log("Redis connected");
  } catch (error) {
    console.error("Redis connection failed:", error);
    process.exit(1);
  }
};

export const disconnectRedis = async (): Promise<void> => {
  await redisClient.quit();
};
