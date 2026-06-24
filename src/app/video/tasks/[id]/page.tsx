import { VideoTaskDetailPage } from "@/components/video/video-pages";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <VideoTaskDetailPage taskId={id} />;
}
