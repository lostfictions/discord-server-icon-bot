/* eslint-disable node/no-process-env */
import { join } from "path";
import { existsSync } from "fs";

import * as Sentry from "@sentry/node";
import { parseEnv, z } from "znv";

const isDev = process.env["NODE_ENV"] !== "production";

if (isDev) {
  require("dotenv").config();
}

export const { SENTRY_DSN, DATA_DIR, DISCORD_TOKEN, DISCORD_GUILD_ID } =
  parseEnv(process.env, {
    SENTRY_DSN: {
      schema: z.string().min(1).optional(),
    },
    // The resource dir is currently checked in to the repo.
    DATA_DIR: z
      .string()
      .min(1)
      .default(() => join(__dirname, "..", "persist")),
    DISCORD_TOKEN: z.string().min(1),
    DISCORD_GUILD_ID: z.string().min(1),
  });

if (!SENTRY_DSN && !isDev) {
  console.warn(
    `Sentry DSN is invalid! Error reporting to Sentry will be disabled.`,
  );
} else {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: isDev ? "dev" : "prod",
    integrations: [
      Sentry.captureConsoleIntegration({
        levels: ["warn", "error", "debug", "assert"],
      }),
    ],
  });
}

if (!existsSync(DATA_DIR)) {
  throw new Error(`Data directory '${DATA_DIR}' doesn't exist!`);
}

export const MASTODON_SERVER = "https://mastodon.social";
