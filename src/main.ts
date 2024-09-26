import { join } from "path";
import { tmpdir } from "os";
import { writeFile } from "fs/promises";

import { REST, APIEmoji } from "discord.js";
import { createCanvas, loadImage } from "@napi-rs/canvas";

import { DISCORD_GUILD_ID, DISCORD_TOKEN } from "./env";
import { randomInArray } from "./util";

const staticDataDir = join(__dirname, "../data");

const argv = process.argv.slice(2);

const emojiPosition = { x: 127, y: 62 };
const emojiSize = 100;

async function makeImage(emojiUrl: string) {
  const bg = await loadImage(join(staticDataDir, "bg.png"));

  const canvas = createCanvas(bg.width, bg.height);
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(bg, 0, 0, bg.width, bg.height);

  const emoji = await loadImage(emojiUrl);
  const aspect = emoji.width / emoji.height;

  ctx.drawImage(
    emoji,
    emojiPosition.x - emojiSize / 2,
    emojiPosition.y - emojiSize / 2,
    emojiSize * aspect,
    emojiSize,
  );

  return canvas;
}

if (argv.includes("local")) {
  console.log("Running locally!");
}

(async () => {
  const client = new REST().setToken(DISCORD_TOKEN);
  client.on("error", (e) => {
    throw e;
  });

  const emojis = (await client.get(
    `/guilds/${DISCORD_GUILD_ID}/emojis`,
  )) as APIEmoji[];

  const emojiUrls = emojis.map((e) =>
    client.cdn.emoji(e.id!, { extension: "png" }),
  );

  const canvas = await makeImage(randomInArray(emojiUrls));
  const buffer = canvas.toBuffer("image/png");

  if (argv.includes("local")) {
    const filename = join(
      tmpdir(),
      `server-logo-${new Date().toISOString().replaceAll(/:|\./g, "-")}.png`,
    );
    await writeFile(filename, buffer);
    console.log(`file://${filename}\n`);
  } else {
    console.log("Setting guild icon!");
    // await guild.setIcon(buffer);
    console.log("Done.");
  }
})().catch((e) => {
  throw e;
});
