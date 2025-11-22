'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import emailjs from '@emailjs/browser';
import Link from 'next/link';
import Header from '../components/Header';
import BackgroundBlobs from '../components/BackgroundBlobs';
import Footer from '../components/Footer';

export default function ContactPage() {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  useEffect(() => {
    if (session?.user?.email) {
      setFormData(prev => ({
        ...prev,
        email: session.user.email || ''
      }));
    }
  }, [session]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      console.error('EmailJS environment variables are missing');
      setSubmitStatus('error');
      setIsSubmitting(false);
      return;
    }

    try {
      await emailjs.send(
        serviceId,
        templateId,
        {
          from_name: formData.name,
          reply_to: formData.email,
          subject: formData.subject,
          message: formData.message,
        },
        publicKey
      );

      setSubmitStatus('success');
      setIsSubmitting(false);
      setFormData(prev => ({ 
        ...prev, 
        name: '', 
        subject: '', 
        message: '' 
        // Keep email if logged in
      }));
    } catch (error) {
      console.error('Failed to send email:', error);
      setSubmitStatus('error');
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
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
          <h1 className="text-4xl font-extrabold text-[#2F1E14] sm:text-5xl">Contact Us</h1>
          <p className="mt-2 text-lg text-[#8F6C54]">We'd love to hear from you</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Contact Information */}
          <div className="space-y-6">
            <div className="rounded-lg border border-[#F3E4D6] bg-white/95 p-6 shadow-sm">
              <h2 className="mb-4 text-2xl font-bold text-[#2F1E14]">Get in Touch</h2>
              <p className="mb-6 text-[#8F6C54] leading-relaxed">
                Have a question, suggestion, or need help? We're here to assist you. Reach out to us through email or fill out the contact form.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[#F18A24]/10">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F18A24]">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-[#2F1E14]">Email</h3>
                    <a
                      href="mailto:help@heroicsoft.com"
                      className="text-[#8F6C54] hover:text-[#F18A24] transition-colors"
                    >
                      help@heroicsoft.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[#F18A24]/10">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F18A24]">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-[#2F1E14]">Response Time</h3>
                    <p className="text-[#8F6C54]">We typically respond within 8-12 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[#F18A24]/10">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F18A24]">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-[#2F1E14]">Support</h3>
                    <p className="text-[#8F6C54]">For technical issues, billing questions, or general inquiries</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Helpful Links */}
            <div className="rounded-lg border border-[#F3E4D6] bg-gradient-to-r from-[#FFF5EB] to-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-[#2F1E14]">Helpful Links</h3>
              <div className="space-y-2">
                <Link href="/faq" className="block text-[#8F6C54] hover:text-[#F18A24] transition-colors">
                  → Frequently Asked Questions
                </Link>
                <Link href="/about" className="block text-[#8F6C54] hover:text-[#F18A24] transition-colors">
                  → About WishTune
                </Link>
                <Link href="/buy-credits" className="block text-[#8F6C54] hover:text-[#F18A24] transition-colors">
                  → Buy Credits
                </Link>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="rounded-lg border border-[#F3E4D6] bg-white/95 p-6 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold text-[#2F1E14]">Send us a Message</h2>
            
            {submitStatus === 'success' && (
              <div className="relative mb-4 rounded-lg border-2 border-green-500 bg-green-50 p-4">
                <button
                  onClick={() => setSubmitStatus('idle')}
                  className="absolute top-2 right-2 text-green-700 hover:text-green-900 transition-colors"
                  aria-label="Close success message"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
                <div className="flex items-center gap-3 pr-6">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-green-800">Message sent!</p>
                    <p className="text-sm text-green-700">We'll get back to you shortly.</p>
                  </div>
                </div>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="mb-4 rounded-lg border-2 border-red-500 bg-red-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-red-800">Failed to send message</p>
                    <p className="text-sm text-red-700">Please try again later or email us directly.</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#2F1E14] mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[#F3E4D6] px-4 py-2 text-[#2F1E14] focus:border-[#F18A24] focus:outline-none transition-colors"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#2F1E14] mb-1">
                  Your Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[#F3E4D6] px-4 py-2 text-[#2F1E14] focus:border-[#F18A24] focus:outline-none transition-colors"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-[#2F1E14] mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[#F3E4D6] px-4 py-2 text-[#2F1E14] focus:border-[#F18A24] focus:outline-none transition-colors"
                  placeholder="What is this about?"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-[#2F1E14] mb-1">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[#F3E4D6] px-4 py-2 text-[#2F1E14] focus:border-[#F18A24] focus:outline-none transition-colors resize-none"
                  placeholder="Tell us how we can help..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#F18A24] px-6 py-3 text-base font-semibold text-white hover:bg-[#E07212] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  'Sending...'
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                    Send Message
                  </>
                )}
              </button>


            </form>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </main>
  );
}

