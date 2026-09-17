import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isHeicFile,
  supportedImageFile,
} from "../src/app/playground/components/UploadSection";
import { generatedImageFile } from "../src/components/UploadImageButton";

test("HEIC/HEIF input recognition also covers empty browser MIME types", () => {
  assert.equal(isHeicFile(new File(["image"], "photo.HEIC")), true);
  assert.equal(isHeicFile(new File(["image"], "photo.heif")), true);
  assert.equal(
    isHeicFile(new File(["image"], "photo", { type: "image/heif" })),
    true,
  );
  assert.equal(
    isHeicFile(new File(["image"], "photo.jpg", { type: "image/jpeg" })),
    false,
  );
});

test("upload validation only accepts generation input formats", () => {
  for (const type of ["image/png", "image/jpeg", "image/webp"]) {
    const file = new File(["image"], "photo", { type });
    assert.equal(supportedImageFile(file), file);
  }
  for (const type of ["image/gif", "image/svg+xml", "application/pdf"]) {
    assert.equal(
      supportedImageFile(new File(["image"], "photo.png", { type })),
      null,
    );
  }
  assert.equal(supportedImageFile(new File(["image"], "photo.txt")), null);
});

test("input files with missing MIME are normalized without changing bytes", async () => {
  const file = new File([new Uint8Array([1, 2, 3])], "photo.JPG", {
    lastModified: 42,
  });
  const normalized = supportedImageFile(file);
  assert.ok(normalized);
  assert.equal(normalized.type, "image/jpeg");
  assert.equal(normalized.lastModified, 42);
  assert.deepEqual(
    new Uint8Array(await normalized.arrayBuffer()),
    new Uint8Array([1, 2, 3]),
  );
});

test("gallery files preserve the generated MIME, extension, and bytes", async () => {
  for (const [type, extension] of [
    ["image/png", "png"],
    ["image/jpeg", "jpg"],
    ["image/webp", "webp"],
  ]) {
    const file = generatedImageFile(`data:${type};base64,AQID`, "Portrait");
    assert.equal(file.type, type);
    assert.ok(file.name.endsWith(`.${extension}`));
    assert.deepEqual(
      new Uint8Array(await file.arrayBuffer()),
      new Uint8Array([1, 2, 3]),
    );
  }
});

test("gallery upload rejects unsupported or malformed data URLs", () => {
  for (const data of [
    "https://example.com/image.png",
    "data:image/svg+xml;base64,AQID",
    "data:image/heic;base64,AQID",
    "data:image/png;base64,",
    "data:image/png;base64,%%%",
    "data:image/png,AQID",
  ]) {
    assert.throws(() => generatedImageFile(data, "image"));
  }
});

test("gallery file names are safe when a style contains filename punctuation", () => {
  const file = generatedImageFile(
    "data:image/png;base64,AQID",
    "Portrait: summer/day?",
  );
  assert.ok(file.name.startsWith("Portrait_ summer_day__"));
  assert.doesNotMatch(file.name, /[<>:"/\\|?*\u0000-\u001f]/);
});
