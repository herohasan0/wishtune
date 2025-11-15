import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-12 text-center">
      <div className="flex items-center justify-center gap-6 text-sm font-semibold text-[#A78973]">
        <Link href="/about" className="hover:text-[#F18A24]">
          About Us
        </Link>
        <Link href="/faq" className="hover:text-[#F18A24]">
          FAQ
        </Link>
        <Link href="/contact" className="hover:text-[#F18A24]">
          Contact
        </Link>
      </div>
    </footer>
  );
}

