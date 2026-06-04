import { getDenCategoryById } from "@/lib/den-categories";
import HubStub from "@/components/HubStub";

export default function FinancePage() {
  return <HubStub category={getDenCategoryById("finance")!} />;
}
