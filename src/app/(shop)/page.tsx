import Home from "@/components/Home";
import { getHomeImages, getPromotions } from "@/db/settings";
import { getCustomerPhotos } from "@/db/reviews";
import { getActiveCoupon } from "@/db/coupons";
import { productSlug } from "@/db/products";
import { couponLabel } from "@/lib/coupon";

export const revalidate = 60;

export default async function HomePage() {
  const [images, photos, promo] = await Promise.all([getHomeImages(), getCustomerPhotos(), getPromotions()]);
  const coupon = await getActiveCoupon(promo.welcomeCoupon);
  return (
    <Home
      images={images}
      photos={photos.map(p => ({ ...p, href: `/produto/${productSlug({ id: p.productId, name: p.productName })}#avaliacoes` }))}
      welcome={coupon ? { code: coupon.code, label: couponLabel(coupon).replace(" off", "") } : null}
    />
  );
}
