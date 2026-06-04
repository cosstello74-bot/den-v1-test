import { getDenCategoryById } from "@/lib/den-categories";
import HubStub from "@/components/HubStub";

export default function TravelPage() {
  return <HubStub category={getDenCategoryById("travel")!} />;
}
