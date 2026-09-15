import {
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID ?? "";
const bucket = process.env.R2_BUCKET ?? "";
const publicBaseUrl = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");
const prefix = (process.env.R2_PREFIX ?? "component").replace(/\/$/, "");

export const R2_COMPONENT_FOLDERS = [
  "CPU",
  "Case",
  "Fan",
  "GPU",
  "HDD",
  "Mainboard",
  "PSU",
  "Ram",
  "SSD",
] as const;

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

export function r2PublicUrl(key: string) {
  return `${publicBaseUrl}/${key.replace(/^\//, "")}`;
}

export function componentImageKey(categoryFolder: string, fileName: string) {
  return `${prefix}/${categoryFolder}/${fileName.replace(/^\//, "")}`;
}

export function componentImageUrl(categoryFolder: string, fileName: string) {
  return r2PublicUrl(componentImageKey(categoryFolder, fileName));
}

export async function uploadPublicImage(
  key: string,
  body: Buffer,
  contentType: string,
) {
  await r2.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  return r2PublicUrl(key);
}

export async function listComponentObjects(categoryFolder?: string) {
  const result = await r2.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: categoryFolder ? `${prefix}/${categoryFolder}/` : `${prefix}/`,
    }),
  );

  return (result.Contents ?? [])
    .map((item) => item.Key)
    .filter((key): key is string => Boolean(key) && !key.endsWith("/"));
}
