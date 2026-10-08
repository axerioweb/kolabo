import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar solid />
      <main className="mx-auto max-w-3xl px-4 pt-28 pb-20 sm:px-6">{children}</main>
      <Footer />
    </>
  );
}
