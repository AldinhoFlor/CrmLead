import { PageHeaderSkel, StatCardsSkel, PanelSkel } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkel />
      <StatCardsSkel />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <PanelSkel />
        <PanelSkel />
      </div>
    </div>
  );
}
