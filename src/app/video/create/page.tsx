import { VideoCreatePage } from "@/components/video/video-pages";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ model?: string | string[] }>;
}) {
  const params = await searchParams;
  const initialModelId = Array.isArray(params.model) ? params.model[0] : params.model;

  return <VideoCreatePage initialModelId={initialModelId} />;
}
