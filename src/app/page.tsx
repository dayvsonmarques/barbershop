import { BannerSlider } from "@/components/banner-slider";
import { HomeHeader } from "@/components/home-header";
import { AboutSection } from "@/components/about-section";
import { ServiceCards } from "@/components/service-cards";
import { InstagramFeed } from "@/components/instagram-feed";
import { MapSection } from "@/components/map-section";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <main>
      <HomeHeader />
      <BannerSlider />
      <div id="sobre">
        <AboutSection />
      </div>
      <div id="diferenciais">
        <ServiceCards />
      </div>
      <div id="instagram">
        <InstagramFeed />
      </div>
      <div id="local">
        <MapSection />
      </div>
      <Footer />
    </main>
  );
}
