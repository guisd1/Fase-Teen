import Home from "@/components/Home";
import { getHomeImages } from "@/db/settings";

export const revalidate = 60;

export default async function HomePage() {
  return <Home images={await getHomeImages()} />;
}
