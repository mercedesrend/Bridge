import { PrepDetailClient } from "@/components/prep-detail-client";

export default async function PrepTopicPage({
  params
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  return <PrepDetailClient optionId={topic} />;
}
