// Run: npm run test:ui (after npx playwright install chromium).
// Or use an installed browser: BROWSER_CHANNEL=msedge npm run test:ui.
// Optional: PLAYWRIGHT_MODULE_PATH=/path/to/playwright, BROWSER_CHANNEL=msedge.
// Artifacts are written to ignored coverage/ui-smoke; no production auth is changed.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { createServer } from "node:http";
import { build } from "esbuild";

const require = createRequire(import.meta.url);
const postcss = require("postcss");
const tailwindcss = require("tailwindcss");
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE_PATH
    ? pathToFileURL(join(process.env.PLAYWRIGHT_MODULE_PATH, "index.mjs")).href
    : "playwright"
);
const { expect } = await import(
  process.env.PLAYWRIGHT_MODULE_PATH
    ? pathToFileURL(join(process.env.PLAYWRIGHT_MODULE_PATH, "test.mjs")).href
    : "playwright/test"
);
const output = resolve("coverage/ui-smoke");
await mkdir(output, { recursive: true });
const stubs = {
  "@clerk/nextjs":
    "export const useAuth = () => ({isLoaded: true, userId: 'smoke-user'});",
  "next/navigation":
    "const router = {replace() {}}; export const useRouter = () => router;",
  "@/providers/uploadthing-provider": `export const useUploadThing = () => ({isUploading: false, startUpload: async files => {
    window.__uiSmoke.uploads.push(...files.map(file => ({name:file.name,type:file.type,size:file.size})));
    return [{url:'https://example.invalid/test.png',key:'smoke-upload'}];
  }});`,
};
await build({
  absWorkingDir: resolve("."),
  entryPoints: [resolve("tests/fixtures/ui-smoke-app.tsx")],
  bundle: true,
  outfile: join(output, "app.js"),
  platform: "browser",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"development"', "process.env": "{}" },
  plugins: [
    {
      name: "external-service-test-doubles",
      setup(builder) {
        builder.onResolve(
          {
            filter:
              /^(@clerk\/nextjs|next\/navigation|@\/providers\/uploadthing-provider)$/,
          },
          (args) => ({ path: args.path, namespace: "test-double" }),
        );
        builder.onLoad({ filter: /.*/, namespace: "test-double" }, (args) => ({
          contents: stubs[args.path],
          loader: "js",
        }));
      },
    },
  ],
});
const css = await postcss([
  tailwindcss(require("../tailwind.config.js")),
]).process(await readFile("src/app/globals.css", "utf8"), {
  from: "src/app/globals.css",
});
await writeFile(join(output, "style.css"), css.css);
const server = createServer(async (request, response) => {
  const name =
    request.url === "/app.js"
      ? "app.js"
      : request.url === "/style.css"
        ? "style.css"
        : null;
  response.setHeader(
    "Content-Type",
    name === "app.js"
      ? "text/javascript"
      : name === "style.css"
        ? "text/css"
        : "text/html",
  );
  response.end(
    name
      ? await readFile(join(output, name))
      : '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><style>body{font-family:Arial,sans-serif}</style></head><body><div id="root"></div><script src="/app.js"></script></body></html>',
  );
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const url = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  headless: true,
  ...(process.env.BROWSER_CHANNEL
    ? { channel: process.env.BROWSER_CHANNEL }
    : {}),
});
const findings = [];
const errors = [];
let assertions = 0;
let testPage;
const check = (condition, message) => {
  assert.ok(condition, message);
  assertions++;
};

try {
  const browserContext = await browser.newContext({ acceptDownloads: true });
  await browserContext.addInitScript(() => {
    for (const provider of ["openai", "gemini", "grok", "openrouter"])
      localStorage.setItem(`${provider}_api_key`, `smoke-${provider}`);
  });
  const page = await browserContext.newPage();
  testPage = page;
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.setViewportSize({ width: 1365, height: 1000 });
  await page.goto(url);
  await page.getByRole("combobox", { name: "Image model" }).waitFor();
  const visible = (locator) => locator.filter({ visible: true });
  const control = (name) =>
    visible(page.getByRole("combobox", { name, exact: true }));
  const button = (name) =>
    visible(page.getByRole("button", { name, exact: true }));
  const choose = async (name, value) => {
    await control(name).click();
    await page.getByRole("option", { name: value, exact: true }).click();
  };
  const modelControls = [
    [true, false], // Sunburst: quality
    [true, false], // Flare: quality
    [true, false], // Mini: quality
    [false, true], // Nano Banana 2: resolution
    [false, true], // Lite: fixed resolution
    [false, true], // Pro: resolution
    [true, true], // Grok: quality and resolution
  ];
  // Read model labels from the rendered options, avoiding hardcoded product tiers.
  await control("Image model").click();
  const modelNames = await page.getByRole("option").allTextContents();
  await page.keyboard.press("Escape");
  check(modelNames.length === 7, "All seven model choices are available");
  for (let index = 0; index < modelNames.length; index++) {
    const name = modelNames[index].trim();
    await choose("Image model", name);
    check(
      (await control("Quality").count()) === (modelControls[index][0] ? 1 : 0),
      `${name}: quality control matches capabilities`,
    );
    check(
      (await control("Resolution").count()) ===
        (modelControls[index][1] ? 1 : 0),
      `${name}: resolution control matches capabilities`,
    );
  }
  await choose("Image model", modelNames[4].trim());
  check(await control("Resolution").isDisabled(), "Lite resolution is fixed");
  await choose("Image model", modelNames[5].trim());
  await choose("Resolution", "4K");
  await choose("Image model", modelNames[4].trim());
  check(
    (await control("Resolution").innerText()).includes("1K"),
    "Unsupported prior resolution resets to 1K",
  );

  const upload = page.locator("#desktop-image");
  await upload.focus();
  await expect(upload).toBeFocused();
  assertions++;
  await upload.setInputFiles({
    name: "bad.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from("<svg />"),
  });
  await page.getByText("Unsupported image format", { exact: true }).waitFor();
  check(
    await button("Transform Image").isDisabled(),
    "Unsupported upload leaves generation disabled",
  );
  await upload.setInputFiles({
    name: "oversized.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(4 * 1024 * 1024 + 1),
  });
  await page.getByText("File too large", { exact: true }).waitFor();
  const sample = Buffer.from(
    (await page.evaluate(() => window.__uiSmoke.sample)).split(",")[1],
    "base64",
  );
  await upload.evaluate((input) => {
    const transfer = new DataTransfer();
    transfer.items.add(
      new File(["unsupported"], "animation.gif", { type: "image/gif" }),
    );
    input.parentElement.dispatchEvent(
      new DragEvent("drop", { bubbles: true, dataTransfer: transfer }),
    );
  });
  check(
    await button("Transform Image").isDisabled(),
    "Drag/drop also rejects unsupported image formats",
  );
  await upload.setInputFiles({
    name: "photo.png",
    mimeType: "image/png",
    buffer: sample,
  });
  check(
    await button("Transform Image").isEnabled(),
    "Supported upload enables generation",
  );
  await button("Remove image").click();
  await upload.evaluate((input) => {
    const transfer = new DataTransfer();
    const bytes = Uint8Array.from(
      atob(window.__uiSmoke.sample.split(",")[1]),
      (value) => value.charCodeAt(0),
    );
    transfer.items.add(new File([bytes], "photo.png", { type: "image/png" }));
    input.parentElement.dispatchEvent(
      new DragEvent("drop", { bubbles: true, dataTransfer: transfer }),
    );
  });
  await expect(button("Transform Image")).toBeEnabled();
  assertions++;
  await button("Remove image").click();
  await upload.setInputFiles({
    name: "photo.png",
    mimeType: "image/png",
    buffer: sample,
  });
  check(
    await button("Transform Image").isEnabled(),
    "The same file can be selected again after removal",
  );

  const generate = async (status, mime = "image/png") => {
    await button("Transform Image").click();
    await page.waitForFunction(() => window.__uiSmoke.pending);
    await expect(control("Image model")).toBeDisabled();
    assertions++;
    await expect(button("Remove image")).toBeDisabled();
    assertions++;
    await expect(control("Aspect ratio")).toBeDisabled();
    assertions++;
    await page.evaluate(
      ([costStatus, outputMime]) =>
        window.__uiSmoke.finish(costStatus, outputMime),
      [status, mime],
    );
    await button("Download").waitFor();
    await visible(page.locator('img[alt="Generated image"]')).waitFor();
    await expect(visible(page.locator('img[alt="Generated image"]'))).toHaveCSS(
      "opacity",
      "1",
    );
    assertions++;
  };
  await page.evaluate(() =>
    window.__uiSmoke.rotateKey("gemini", "smoke-rotated"),
  );
  await generate("estimated", "image/jpeg");
  check(
    await page.evaluate(
      () => window.__uiSmoke.requests.at(-1).apiKey === "smoke-rotated",
    ),
    "Generation uses the rotated API key",
  );
  await visible(page.getByRole("region", { name: "Generation cost" }))
    .getByText("Estimated request cost", { exact: true })
    .waitFor();
  await visible(
    page.getByText("Usage and price breakdown", { exact: true }),
  ).click();
  check(
    await visible(
      page.getByText("1,120 tokens × $30.00 / 1M tokens", { exact: true }),
    ).isVisible(),
    "Cost breakdown renders token counts and unit pricing",
  );
  const downloadPromise = page.waitForEvent("download");
  await button("Download").click();
  const download = await downloadPromise;
  check(
    download.suggestedFilename().endsWith(".jpg"),
    "JPEG download uses a jpg extension",
  );
  await download.saveAs(join(output, "download.jpg"));
  const jpeg = await readFile(join(output, "download.jpg"));
  check(
    jpeg[0] === 255 && jpeg[1] === 216,
    "JPEG download contains JPEG bytes",
  );
  await button("Save to Gallery").click();
  await button("Saved to Gallery").waitFor();
  check(
    await button("Saved to Gallery").isDisabled(),
    "Repeated gallery saves are disabled",
  );
  check(
    await page.evaluate(
      () => window.__uiSmoke.uploads.at(-1).type === "image/jpeg",
    ),
    "Gallery upload preserves JPEG MIME",
  );
  await choose("Aspect ratio", "Portrait (2:3)");
  const box = await visible(
    page.locator('img[alt="Generated image"]'),
  ).evaluate((image) => {
    const bounds = image.parentElement.getBoundingClientRect();
    return { width: bounds.width, height: bounds.height };
  });
  check(
    Math.abs(box.width - box.height) < 2,
    "Changing settings preserves the existing result aspect ratio",
  );
  await page.screenshot({
    path: join(output, "desktop.png"),
    fullPage: true,
    style: "[data-sonner-toaster]{visibility:hidden}",
  });

  for (const [status, label] of [
    ["reported", "Reported request cost"],
    ["partial", "Partial cost estimate"],
    ["unavailable", "Cost unavailable"],
  ]) {
    await generate(status);
    const panel = visible(
      page.getByRole("region", { name: "Generation cost" }),
    );
    await panel.getByText(label, { exact: true }).waitFor();
    check(await panel.isVisible(), `${status} cost status displays distinctly`);
    if (status === "unavailable")
      check(
        !(await panel.innerText()).includes("$0"),
        "Missing usage is not displayed as a free generation",
      );
  }
  await page.evaluate(() => window.__uiSmoke.rotateKey("gemini", ""));
  await page.getByText("Via OpenRouter", { exact: true }).waitFor();
  await generate("reported");
  check(
    await page.evaluate(
      () => window.__uiSmoke.requests.at(-1).keySource === "openrouter",
    ),
    "Removing direct key switches generation to the current OpenRouter key",
  );

  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.waitForTimeout(100);
    const overflow = await page.evaluate(() => ({
      width: window.innerWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    if (overflow.scroll > overflow.width)
      findings.push({ viewport: width, overflow, type: "horizontal-overflow" });
    if (overflow.scroll <= overflow.width) assertions++;
    if (width === 390)
      await page.screenshot({
        path: join(output, "mobile.png"),
        fullPage: true,
        style: "[data-sonner-toaster]{visibility:hidden}",
      });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await button("Make another").click();
  const mobileUpload = page.locator("#mobile-image");
  await mobileUpload.setInputFiles({
    name: "photo.png",
    mimeType: "image/png",
    buffer: sample,
  });
  check(
    await button("Transform Image").isEnabled(),
    "Mobile upload enables generation",
  );
  await generate("estimated", "image/webp");
  await page.screenshot({
    path: join(output, "mobile.png"),
    fullPage: true,
    style: "[data-sonner-toaster]{visibility:hidden}",
  });
  const mobileDownloadPromise = page.waitForEvent("download");
  await button("Download").click();
  check(
    (await mobileDownloadPromise).suggestedFilename().endsWith(".webp"),
    "Mobile download preserves WebP extension",
  );
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await expect(button("Make another")).toHaveCSS("color", "rgb(255, 255, 255)");
  assertions++;
  check(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    "Dark mobile layout has no overflow",
  );
  await page.screenshot({
    path: join(output, "mobile-dark.png"),
    fullPage: true,
    style: "[data-sonner-toaster]{visibility:hidden}",
  });
  await page.setViewportSize({ width: 1365, height: 1000 });
  await page.screenshot({
    path: join(output, "desktop-dark.png"),
    fullPage: true,
    style: "[data-sonner-toaster]{visibility:hidden}",
  });
  check(
    findings.length === 0,
    `No horizontal overflow: ${JSON.stringify(findings)}`,
  );
  check(errors.length === 0, `No browser runtime errors: ${errors.join("; ")}`);
  await writeFile(
    join(output, "report.json"),
    JSON.stringify({ assertions, findings, errors }, null, 2),
  );
  console.log(
    `UI smoke passed: ${assertions} assertions. Desktop/mobile screenshots: ${output}`,
  );
} catch (error) {
  if (testPage) {
    await testPage.screenshot({
      path: join(output, "failure.png"),
      fullPage: true,
    });
    await writeFile(join(output, "failure.html"), await testPage.content());
  }
  await writeFile(
    join(output, "report.json"),
    JSON.stringify(
      { assertions, findings, errors, failure: String(error) },
      null,
      2,
    ),
  );
  throw error;
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
}
