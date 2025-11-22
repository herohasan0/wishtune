'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import BackgroundBlobs from '../components/BackgroundBlobs';
import Footer from '../components/Footer';

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      question: 'What is WishTune?',
      answer: 'WishTune is an AI-powered platform that creates personalized songs for special occasions. Simply provide a name, celebration type, and music style, and we\'ll generate a unique song with multiple variations in minutes.'
    },
    {
      question: 'How does it work?',
      answer: 'Creating a song is easy! Enter the name of the person you\'re celebrating, choose the type of celebration (birthday, graduation, anniversary, holiday, or just because), select your preferred music style (Pop, Rock, Lullaby, or Folk), and click create. Our AI will generate your personalized song with multiple variations.'
    },
    {
      question: 'Do I need to create an account?',
      answer: 'You can create your first song without an account! However, to save your songs, access them later, and purchase additional credits, you\'ll need to sign up with a Google account. It\'s free and takes just seconds.'
    },
    {
      question: 'How many free songs do I get?',
      answer: 'New users get 2 free songs when they first sign up. After that, you can purchase credits to create more songs. Each credit allows you to create one song with multiple variations.'
    },
    {
      question: 'What are credits and how do they work?',
      answer: 'Credits are used to create songs on WishTune. One credit equals one song creation (with multiple variations). You receive 2 free credits when you sign up, and you can purchase additional credits anytime. Credits never expire, so you can use them whenever you want.'
    },
    {
      question: 'How much do credits cost?',
      answer: 'Credit packages are available at different price points. Visit our Buy Credits page to see current pricing and package options. We offer various packages to suit different needs.'
    },
    {
      question: 'Do credits expire?',
      answer: 'No! Credits never expire. Once you purchase credits, they\'re yours to use whenever you want, whether that\'s today or years from now.'
    },
    {
      question: 'How long does it take to create a song?',
      answer: 'Song creation typically takes a few minutes. The exact time can vary depending on server load, but you\'ll usually receive your song within 2-5 minutes. You can track the progress on your songs page.'
    },
    {
      question: 'What music styles are available?',
      answer: 'We currently offer four music styles: Pop (upbeat & catchy), Rock (energetic & fun), Lullaby (soft & soothing), and Folk (acoustic & heartfelt). Each style creates a unique sound and feel for your personalized song.'
    },
    {
      question: 'What celebration types can I choose?',
      answer: 'You can create songs for birthdays, graduations, anniversaries, holidays, or just because! Each celebration type influences the theme and lyrics of your song.'
    },
    {
      question: 'Can I edit the song after it\'s created?',
      answer: 'Each song creation includes multiple variations, so you can choose your favorite version. If you\'d like a different style or theme, you can create a new song with your preferences.'
    },
    {
      question: 'Can I download my songs?',
      answer: 'Yes! Once your song is complete, you can play it directly on the website. Download functionality may vary, but you can always access and share your songs through your account.'
    },
    {
      question: 'Can I share my songs with others?',
      answer: 'Absolutely! Your songs are perfect for sharing with friends and family. You can share them via the links provided or play them directly from your account.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept various payment methods through our secure payment processor. Visit the Buy Credits page to see available payment options for your region.'
    },
    {
      question: 'Is my payment information secure?',
      answer: 'Yes, we use secure, industry-standard payment processing to ensure your payment information is protected. We don\'t store your full payment details on our servers.'
    },
    {
      question: 'What if I\'m not satisfied with my song?',
      answer: 'Each song creation includes multiple variations, giving you options to choose from. If you\'d like to try a different style or theme, you can create a new song. We\'re always working to improve our AI to deliver the best possible results.'
    },
    {
      question: 'Can I use the songs commercially?',
      answer: 'Songs created on WishTune are for personal use. For commercial use, please contact us at help@heroicsoft.com to discuss licensing options.'
    },
    {
      question: 'What happens if my song creation fails?',
      answer: 'If a song creation fails, please contact our support team at help@heroicsoft.com. We\'ll investigate the issue and, if necessary, restore your credit or provide a refund.'
    },
    {
      question: 'How do I contact support?',
      answer: 'You can reach us at help@heroicsoft.com for any questions, issues, or feedback. We\'re here to help and typically respond within 24-48 hours.'
    },
    {
      question: 'Who owns WishTune?',
      answer: 'WishTune is proudly owned and operated by heroicsoft.'
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <main className="relative min-h-screen px-4 py-6 text-[#3F2A1F] sm:py-10">
      <BackgroundBlobs />
      <Header />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-8">
        {/* Back Button */}
        <Link
          href="/"
          className="flex items-center gap-2 self-start -ml-2 px-2 py-2 hover:opacity-70 transition-opacity"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#8F6C54]/30 bg-white/50">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#2F1E14]">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </div>
          <span className="text-sm font-medium text-[#2F1E14]">Home</span>
        </Link>

        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-[#2F1E14] sm:text-5xl">Frequently Asked Questions</h1>
          <p className="mt-2 text-lg text-[#8F6C54]">Everything you need to know about WishTune</p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-lg border border-[#F3E4D6] bg-white/95 shadow-sm transition-all"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-[#FFF5EB]/50 transition-colors"
              >
                <span className="font-semibold text-[#2F1E14] pr-8">{faq.question}</span>
                <div className="flex-shrink-0">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`text-[#8F6C54] transition-transform ${openIndex === index ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-[#8F6C54] leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Still Have Questions Section */}
        <div className="rounded-lg border border-[#F3E4D6] bg-gradient-to-r from-[#FFF5EB] to-white p-6 shadow-sm">
          <div className="text-center">
            <h2 className="mb-2 text-xl font-bold text-[#2F1E14]">Still have questions?</h2>
            <p className="mb-4 text-[#8F6C54]">
              Can't find the answer you're looking for? We're here to help!
            </p>
            <a
              href="mailto:help@heroicsoft.com"
              className="inline-flex items-center gap-2 rounded-lg bg-[#F18A24] px-6 py-3 text-base font-semibold text-white hover:bg-[#E07212] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              Contact Us
            </a>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </main>
  );
}

