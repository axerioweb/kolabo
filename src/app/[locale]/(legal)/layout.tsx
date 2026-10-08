import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 pt-32 pb-20 sm:px-6">
        {children}
      </main>
      <Footer />
    </>
  );
}
