import { prisma } from "@/lib/db";

export async function getFeaturedTestimonialsForHome(limit = 3) {
  return prisma.testimonial.findMany({
    where: { isApproved: true, featured: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getPublishedCaseStudies() {
  return prisma.caseStudy.findMany({
    where: { isPublished: true },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });
}

export async function getFeaturedCaseStudy() {
  return prisma.caseStudy.findFirst({
    where: { isPublished: true, featured: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPublishedCaseStudyById(id: string) {
  return prisma.caseStudy.findFirst({
    where: { id, isPublished: true },
  });
}
