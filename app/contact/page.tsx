'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import BackgroundBlobs from '../components/BackgroundBlobs';
import Footer from '../components/Footer';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    // Create mailto link (since we don't have a backend endpoint for contact form)
    const subject = encodeURIComponent(formData.subject || 'Contact from WishTune');
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
    );
    const mailtoLink = `mailto:wishtune@info.com?subject=${subject}&body=${body}`;

    // Open email client
    window.location.href = mailtoLink;

    // Simulate success after a brief delay
    setTimeout(() => {
      setSubmitStatus('success');
      setIsSubmitting(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 5000);
    }, 500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FFF5EB] px-4 py-6 text-[#3F2A1F] sm:py-10">
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
                      href="mailto:wishtune@info.com"
                      className="text-[#8F6C54] hover:text-[#F18A24] transition-colors"
                    >
                      wishtune@info.com
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
                    <p className="text-[#8F6C54]">We typically respond within 24-48 hours</p>
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
              <div className="mb-4 rounded-lg border-2 border-green-500 bg-green-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-green-800">Message sent!</p>
                    <p className="text-sm text-green-700">Your email client should open shortly.</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#2F1E14] mb-1">
                  Name *
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
                  Email *
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
                <select
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[#F3E4D6] px-4 py-2 text-[#2F1E14] focus:border-[#F18A24] focus:outline-none transition-colors bg-white"
                >
                  <option value="">Select a subject</option>
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Billing Question">Billing Question</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Bug Report">Bug Report</option>
                  <option value="Other">Other</option>
                </select>
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
                className="w-full rounded-lg bg-[#F18A24] px-6 py-3 text-base font-semibold text-white hover:bg-[#E07212] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>

              <p className="text-xs text-[#8F6C54] text-center">
                By clicking "Send Message", your default email client will open with a pre-filled message.
              </p>
            </form>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </main>
  );
}

