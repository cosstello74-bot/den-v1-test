import { getDenCategoryById } from "@/lib/den-categories";
import HubStub from "@/components/HubStub";

export default function HealthPage() {
  return <HubStub category={getDenCategoryById("health")!} />;
}
