import { getHomeImages } from "@/db/settings";
import { blobMode } from "@/lib/blob";
import { getStore } from "@/stores";
import HomeImagesForm from "@/components/admin/HomeImagesForm";

export default async function HomeImagesPage() {
  const images = await getHomeImages();
  return (
    <>
      <div className="admin-head">
        <h1>Página inicial</h1>
        <a className="btn btn-light" href="/" target="_blank" rel="noopener">Ver página ↗</a>
      </div>
      <HomeImagesForm initial={images} blobMode={blobMode()} defaultHero={getStore().texts.hero.image} />
    </>
  );
}
