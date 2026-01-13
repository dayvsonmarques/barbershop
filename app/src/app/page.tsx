import { BannerSlider } from "@/components/banner-slider";
import { AboutSection } from "@/components/about-section";
import { ServiceCards } from "@/components/service-cards";
import { InstagramFeed } from "@/components/instagram-feed";
import { MapSection } from "@/components/map-section";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <main>
      <BannerSlider />
      <AboutSection />
      <ServiceCards />
      <InstagramFeed />
      <MapSection />
      <Footer />
    </main>
  );
}
