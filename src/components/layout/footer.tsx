import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { navLinks } from "@/data/mock-data";

// Custom social media icons
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const YouTubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

interface ContactInfo {
  email: string;
  phone: string;
  location: string;
}

export function Footer() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [footerDescription, setFooterDescription] = useState("");
  const [siteLogo, setSiteLogo] = useState("");
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    email: "hello@mubarista.com",
    phone: "+250 788 000 000",
    location: "Kigali, Rwanda · Global",
  });
  const [socialLinks, setSocialLinks] = useState({
    instagram: "",
    facebook: "",
    youtube: "",
    twitter: "",
    tiktok: "",
    whatsapp: "",
  });

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());

    fetchSiteSettings();
    fetchContactInfo();
    // Re-fetch every 5 seconds to get latest settings
    const interval = setInterval(() => {
      setCurrentYear(new Date().getFullYear());
      fetchSiteSettings();
      fetchContactInfo();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchSiteSettings() {
    try {
      const res = await fetch("/api/site-settings");
      const data = await res.json();
      setFooterDescription(data.footerDescription);
      setSiteLogo(data.logo || "");
      setSocialLinks({
        instagram: data.instagram || "",
        facebook: data.facebook || "",
        youtube: data.youtube || "",
        twitter: data.twitter || "",
        tiktok: data.tiktok || "",
        whatsapp: data.whatsapp || "",
      });
    } catch (error) {
      console.error("Error fetching site settings:", error);
    }
  }

  async function fetchContactInfo() {
    try {
      const res = await fetch("/api/contact");
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setContactInfo({
            email: data.email || contactInfo.email,
            phone: data.phone || contactInfo.phone,
            location: data.location || contactInfo.location,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching contact info:", error);
    }
  }

  return (
    <footer className="border-t border-white/5 bg-muted-bg/50">
      <div className="mx-auto max-w-7xl section-padding pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              {siteLogo ? (
                <img src={siteLogo} alt="MUBARISTA" className="h-10 w-auto bg-transparent" />
              ) : null}
              <span className="text-xl font-bold leading-none animate-gradient-text">
                MUBARISTA
                <span className="text-[0.45em] tracking-widest uppercase align-top ml-0.5">HUB</span>
              </span>
            </Link>
            <p className="text-muted text-sm leading-relaxed mb-6">
              {footerDescription}
            </p>
            <div className="flex gap-3">
              {["blue", "green", "yellow", "red"].map((color, i) => (
                <motion.div
                  key={color}
                  className="h-3 w-3 rounded-full"
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                    backgroundColor: [
                      color === "blue" ? "#2563eb" : color === "green" ? "#16a34a" : color === "yellow" ? "#eab308" : "#dc2626",
                      color === "blue" ? "#16a34a" : color === "green" ? "#eab308" : color === "yellow" ? "#dc2626" : "#2563eb",
                      color === "blue" ? "#eab308" : color === "green" ? "#dc2626" : color === "yellow" ? "#2563eb" : "#16a34a",
                      color === "blue" ? "#dc2626" : color === "green" ? "#2563eb" : color === "yellow" ? "#16a34a" : "#eab308",
                      color === "blue" ? "#2563eb" : color === "green" ? "#16a34a" : color === "yellow" ? "#eab308" : "#dc2626",
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2">
              {navLinks.slice(0, 6).map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted text-sm hover:text-blue transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              {navLinks.slice(6, 9).map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted text-sm hover:text-blue transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-muted">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue" />
                {contactInfo.email}
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-green" />
                {contactInfo.phone}
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red" />
                {contactInfo.location}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-muted text-sm">
            © {currentYear} MUBARISTA. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              Support
            </Link>
          </div>
          {/* Social Media Links */}
          {(socialLinks.instagram || socialLinks.facebook || socialLinks.youtube || socialLinks.twitter || socialLinks.tiktok || socialLinks.whatsapp) && (
            <div className="flex gap-4">
              {socialLinks.instagram && (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted hover:from-pink-500 hover:to-purple-500 transition-all duration-300"
                  aria-label="Instagram"
                  style={{
                    background: 'linear-gradient(to right, #f09433, #e6683c, #dc2743, #cc2366, #bc1888, #8a3ab9)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  } as any}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, #f09433, #e6683c, #dc2743, #cc2366, #bc1888, #8a3ab9)';
                    (e.currentTarget.style as any).webkitBackgroundClip = 'text';
                    (e.currentTarget.style as any).webkitTextFillColor = 'transparent';
                    e.currentTarget.style.backgroundClip = 'text';
                  }}
                >
                  <InstagramIcon className="h-5 w-5" />
                </a>
              )}
              {socialLinks.facebook && (
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted hover:text-blue-600 transition-all duration-300"
                  aria-label="Facebook"
                >
                  <FacebookIcon className="h-5 w-5" />
                </a>
              )}
              {socialLinks.youtube && (
                <a
                  href={socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted hover:text-red-600 transition-all duration-300"
                  aria-label="YouTube"
                >
                  <YouTubeIcon className="h-5 w-5" />
                </a>
              )}
              {socialLinks.twitter && (
                <a
                  href={socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted hover:text-black transition-all duration-300"
                  aria-label="Twitter"
                >
                  <TwitterIcon className="h-5 w-5" />
                </a>
              )}
              {socialLinks.tiktok && (
                <a
                  href={socialLinks.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted hover:from-cyan-400 hover:to-pink-500 transition-all duration-300"
                  aria-label="TikTok"
                  style={{
                    background: 'linear-gradient(to right, #00f2ea, #ff0050)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  } as any}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, #00f2ea, #ff0050)';
                    (e.currentTarget.style as any).webkitBackgroundClip = 'text';
                    (e.currentTarget.style as any).webkitTextFillColor = 'transparent';
                    e.currentTarget.style.backgroundClip = 'text';
                  }}
                >
                  <TikTokIcon className="h-5 w-5" />
                </a>
              )}
              {socialLinks.whatsapp && (
                <a
                  href={socialLinks.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted hover:text-green-500 transition-all duration-300"
                  aria-label="WhatsApp"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
