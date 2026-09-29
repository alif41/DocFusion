import React, { useState } from 'react';
import { Mail, MessageSquare, Send, CheckCircle2, HelpCircle } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { GENERAL_FAQS } from '../data/mockData';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export const ContactPage: React.FC = () => {
  useDocumentTitle('Contact - Support & Roadmap Feedback');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'general',
    subject: '',
    message: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    if (!formData.email.includes('@')) {
      setErrorMsg('Please provide a valid email address.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSubmitted(true);
    }, 1000);
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormData({
      name: '',
      email: '',
      category: 'general',
      subject: '',
      message: '',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 space-y-16 sm:space-y-24">
      {/* 1. Page Header */}
      <section className="text-center max-w-2xl mx-auto space-y-4">
        <Badge variant="purple" size="md">
          Reach Our Engineering Team
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Contact DocFusion
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
          Questions about our architecture, feature roadmap, or enterprise inquiries? Send us a note and we will reply promptly.
        </p>
      </section>

      {/* 2. Main Contact Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-start">
        {/* Contact Information & Channels (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-slate-200 dark:border-[#202030] bg-white dark:bg-[#0c0c14] p-6 sm:p-8 space-y-6 shadow-xs">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Direct Communication</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              We respond to all technical inquiries, feature suggestions, and security reports within 24 hours.
            </p>

            <div className="space-y-3.5 text-sm">
              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 dark:bg-[#141420] border border-slate-200 dark:border-[#232336]">
                <div className="w-9 h-9 rounded-lg bg-[#7c3aed]/15 text-[#7c3aed] dark:text-[#a78bfa] flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-semibold text-slate-900 dark:text-white text-xs">Direct Support &amp; Inquiries</h5>
                  <a
                    href="mailto:sardermdalalif@gmail.com"
                    className="text-xs text-[#7c3aed] dark:text-[#a78bfa] font-medium hover:underline"
                  >
                    sardermdalalif@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 dark:bg-[#141420] border border-slate-200 dark:border-[#232336]">
                <div className="w-9 h-9 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-semibold text-slate-900 dark:text-white text-xs">Lead Developer</h5>
                  <p className="text-xs text-slate-700 dark:text-neutral-300 font-medium">Sarder Md Al Alif</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 dark:bg-[#141420] border border-slate-200 dark:border-[#232336]">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-semibold text-slate-900 dark:text-white text-xs">Security &amp; Bug Audits</h5>
                  <a
                    href="mailto:sardermdalalif@gmail.com?subject=Security%20Audit%20Report"
                    className="text-xs text-[#7c3aed] dark:text-[#a78bfa] font-medium hover:underline"
                  >
                    sardermdalalif@gmail.com
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-[#1c1c28]">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-neutral-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                <span>Support Status: All Systems Operational</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form (7 cols) */}
        <div className="lg:col-span-7">
          <div className="rounded-3xl border border-slate-200 dark:border-[#222234] bg-white dark:bg-[#0d0d16] p-6 sm:p-10 shadow-sm">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Message Dispatched!</h3>
                  <p className="text-sm text-slate-600 dark:text-neutral-400 max-w-md mx-auto">
                    Thank you for reaching out to DocFusion. A member of our team has received your communication and will follow up shortly.
                  </p>
                </div>
                <div className="pt-4">
                  <Button variant="secondary" size="md" onClick={handleReset}>
                    Send Another Message
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Send a Message</h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">
                    Fill out the form below. All fields marked with an asterisk are required.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/25 text-rose-700 dark:text-rose-300 text-xs">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-700 dark:text-neutral-400 mb-1.5">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Jane Doe"
                      className="w-full bg-slate-50 dark:bg-[#141422] border border-slate-300 dark:border-[#252538] rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-[#7c3aed] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-700 dark:text-neutral-400 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="jane@example.com"
                      className="w-full bg-slate-50 dark:bg-[#141422] border border-slate-300 dark:border-[#252538] rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-[#7c3aed] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-700 dark:text-neutral-400 mb-1.5">
                      Inquiry Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full bg-slate-50 dark:bg-[#141422] border border-slate-300 dark:border-[#252538] rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#7c3aed] transition-colors"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="feature">Tool Proposal</option>
                      <option value="enterprise">Enterprise &amp; Licensing</option>
                      <option value="security">Security &amp; Bug Report</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-700 dark:text-neutral-400 mb-1.5">
                      Subject
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="e.g., Inquiring about enterprise deployment"
                      className="w-full bg-slate-50 dark:bg-[#141422] border border-slate-300 dark:border-[#252538] rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-[#7c3aed] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-700 dark:text-neutral-400 mb-1.5">
                    Your Message *
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us what's on your mind..."
                    className="w-full bg-slate-50 dark:bg-[#141422] border border-slate-300 dark:border-[#252538] rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-[#7c3aed] transition-colors resize-none"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-[11px] font-mono text-slate-500 dark:text-neutral-500">
                    Protected by client-side verification
                  </span>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isLoading}
                    rightIcon={<Send className="w-3.5 h-3.5" />}
                    className="w-full sm:w-auto"
                  >
                    Submit Message
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 3. Frequently Asked Questions */}
      <section className="space-y-6 pt-4">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <Badge variant="neutral" size="sm">Quick Help</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto">
          {GENERAL_FAQS.map((faq, idx) => (
            <div
              key={idx}
              className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0c0c14] border border-slate-200 dark:border-[#1e1e2d] space-y-2 shadow-xs"
            >
              <h4 className="text-base font-semibold text-slate-900 dark:text-white flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-[#7c3aed] dark:text-[#a78bfa] shrink-0 mt-1" />
                <span>{faq.question}</span>
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 leading-relaxed pl-6 font-normal">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
