import { getDenCategoryById } from "@/lib/den-categories";
import HubStub from "@/components/HubStub";

export default function HomePage() {
  return <HubStub category={getDenCategoryById("home")!} />;
}
