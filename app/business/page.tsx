import { getDenCategoryById } from "@/lib/den-categories";
import HubStub from "@/components/HubStub";

export default function BusinessPage() {
  return <HubStub category={getDenCategoryById("business")!} />;
}
