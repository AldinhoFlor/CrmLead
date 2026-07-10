import {
  PageHeaderSkel,
  StatCardsSkel,
  CardsGridSkel,
  PanelSkel,
} from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkel />
      <StatCardsSkel />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <CardsGridSkel count={4} />
        <PanelSkel />
      </div>
    </div>
  );
}
