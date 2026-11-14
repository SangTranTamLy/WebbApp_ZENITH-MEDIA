import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { AssetFile } from "@zenith/shared";
import type { Config } from "../config.js";
import { ShopError } from "../domain/errors.js";

export interface Storage {
  upload(
    bucket: AssetFile["bucket"],
    key: string,
    type: string,
  ): Promise<string>;
  download(
    bucket: AssetFile["bucket"],
    key: string,
    name?: string,
  ): Promise<string>;
  head(
    bucket: AssetFile["bucket"],
    key: string,
  ): Promise<{ size: number; type: string }>;
  copy(bucket: AssetFile["bucket"], from: string, to: string): Promise<void>;
  remove(bucket: AssetFile["bucket"], key: string): Promise<void>;
  publicUrl(key: string): string;
}
export class R2Storage implements Storage {
  private client: S3Client;
  constructor(private config: Config) {
    this.client = new S3Client({
      region: "auto",
      endpoint: config.r2Endpoint,
      credentials: {
        accessKeyId: config.r2Key,
        secretAccessKey: config.r2Secret,
      },
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }
  private bucket(kind: AssetFile["bucket"]) {
    const name =
      kind === "products"
        ? this.config.productsBucket
        : this.config.previewsBucket;
    if (!name)
      throw new ShopError(
        503,
        "STORAGE_NOT_CONFIGURED",
        "Kho lưu trữ chưa được cấu hình.",
      );
    return name;
  }
  async upload(bucket: AssetFile["bucket"], key: string, type: string) {
    return getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket(bucket),
        Key: key,
        ContentType: type,
      }),
      { expiresIn: 900 },
    );
  }
  async download(bucket: AssetFile["bucket"], key: string, name?: string) {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket(bucket),
        Key: key,
        ...(name
          ? {
              ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
            }
          : {}),
      }),
      { expiresIn: 300 },
    );
  }
  async head(bucket: AssetFile["bucket"], key: string) {
    try {
      const h = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket(bucket), Key: key }),
      );
      return {
        size: h.ContentLength ?? 0,
        type: h.ContentType ?? "application/octet-stream",
      };
    } catch (error) {
      if (
        (error as { $metadata?: { httpStatusCode: number } }).$metadata
          ?.httpStatusCode === 404
      )
        throw new ShopError(
          404,
          "OBJECT_MISSING",
          "Không tìm thấy file trong kho.",
        );
      throw new ShopError(
        503,
        "STORAGE_UNAVAILABLE",
        "Không thể kiểm tra kho lưu trữ. Hãy thử lại.",
      );
    }
  }
  async copy(bucket: AssetFile["bucket"], from: string, to: string) {
    const b = this.bucket(bucket);
    await this.client.send(
      new CopyObjectCommand({
        Bucket: b,
        Key: to,
        CopySource: `${b}/${from.split("/").map(encodeURIComponent).join("/")}`,
      }),
    );
  }
  async remove(bucket: AssetFile["bucket"], key: string) {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket(bucket), Key: key }),
    );
  }
  publicUrl(key: string) {
    if (!/^https:\/\/[^/]+/i.test(this.config.previewOrigin))
      throw new ShopError(
        503,
        "PREVIEW_ORIGIN_REQUIRED",
        "Cần cấu hình HTTPS CDN cho Preview trước khi hoàn tất tác vụ.",
      );
    return `${this.config.previewOrigin.replace(/\/$/, "")}/${key.split("/").map(encodeURIComponent).join("/")}`;
  }
}
