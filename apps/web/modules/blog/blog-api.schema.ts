import { z } from "zod";

export const blogCreateBodySchema = z.object({
  title: z.string().min(1).max(300),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, "Slug must be URL-safe (letters, numbers, hyphens)")
    .optional(),
  content: z.string().min(1).max(200_000),
  coverImageUrl: z.string().url().max(2000).optional().nullable(),
  tags: z.array(z.string().max(64)).max(40).optional(),
  seoTitle: z.string().max(300).optional().nullable(),
  seoDescription: z.string().max(500).optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
});

export const blogPatchBodySchema = z
  .object({
    title: z.string().min(1).max(300).optional(),
    slug: z
      .string()
      .min(1)
      .max(200)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i)
      .optional(),
    content: z.string().min(1).max(200_000).optional(),
    coverImageUrl: z.string().url().max(2000).optional().nullable(),
    tags: z.array(z.string().max(64)).max(40).optional(),
    seoTitle: z.string().max(300).optional().nullable(),
    seoDescription: z.string().max(500).optional().nullable(),
    status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "At least one field required" });
