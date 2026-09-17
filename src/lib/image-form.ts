import {
  getImageModel,
  getModelSettings,
  type ImageModelKey,
  type ApiKeySource,
  type ImageQuality,
  type ImageResolution,
  type ImageSize,
} from "./image-models";

/** Build only parameters the selected model supports, including after a model switch. */
export function createImageForm(input: {
  model: ImageModelKey;
  keySource: ApiKeySource;
  apiKey: string;
  prompt: string;
  image: File;
  quality: ImageQuality;
  resolution: ImageResolution;
  size: ImageSize;
}) {
  const model = getImageModel(input.model)!;
  const settings = getModelSettings(
    input.model,
    input.quality,
    input.resolution,
  );
  const form = new FormData();
  form.set("model", input.model);
  form.set("apiKey", input.apiKey);
  form.set("keySource", input.keySource);
  form.set("prompt", input.prompt);
  form.set("image", input.image);
  form.set("size", input.size);
  if (model.qualities.length) form.set("quality", settings.quality);
  if (model.resolutions.length) form.set("resolution", settings.resolution);
  return form;
}
