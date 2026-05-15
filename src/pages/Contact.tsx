import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, MapPin, Phone, Send, Clock, Users, CheckCircle } from 'lucide-react';

export function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', email: '', subject: '', message: '' });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto z-10 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-20"
      >
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 italic">Get In Touch</h1>
        <p className="max-w-3xl mx-auto text-zinc-400 text-lg">Have questions about EDU-REV or the CAROA engine? Our team of AI experts is ready to help you transform education.</p>
      </motion.div>

      {/* Contact Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 max-w-6xl mx-auto">
        {[
          { icon: Mail, title: 'Email Us', content: 'hello@edurev.ai', subtext: 'Response within 24 hours' },
          { icon: Phone, title: 'Call Us', content: '+1 (555) 888-CARO', subtext: 'Mon-Fri, 9 AM - 6 PM PST' },
          { icon: MapPin, title: 'Visit Us', content: 'Neural Valley, CA', subtext: 'Headquarters & Innovation Lab' }
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center hover:bg-white/10 transition-colors group"
            >
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Icon size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
              <p className="text-indigo-400 font-semibold mb-1">{item.content}</p>
              <p className="text-sm text-zinc-500">{item.subtext}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Main Contact Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-6xl mx-auto mb-20">
        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-2"
        >
          <div className="bg-white/5 border border-white/10 rounded-3xl p-12">
            <h2 className="text-3xl font-bold text-white mb-2">Send us a message</h2>
            <p className="text-zinc-400 mb-8">Fill out the form below and we'll get back to you as soon as possible.</p>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16"
              >
                <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={48} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                <p className="text-zinc-400">Thank you for reaching out. We'll be in touch shortly.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:bg-black/70 transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:bg-black/70 transition-colors"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:bg-black/70 transition-colors"
                    placeholder="How can we help?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:bg-black/70 transition-colors resize-none"
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm group"
                >
                  Send Message
                  <Send size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            )}
          </div>
        </motion.div>

        {/* Sidebar Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          {[
            { icon: Clock, title: 'Response Time', desc: 'We aim to respond within 24 business hours' },
            { icon: Users, title: 'Dedicated Support', desc: 'Enterprise clients get a dedicated account manager' },
            { icon: Mail, title: 'Multiple Channels', desc: 'Reach us via email, phone, or this form' }
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon size={20} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">{item.title}</h4>
                    <p className="text-sm text-zinc-400">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* FAQ Section */}
      {/* FAQ Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-32 max-w-5xl mx-auto"
      >
        <div className="text-center mb-20">
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-6 italic">Frequently Asked Questions</h2>
          <div className="w-20 h-1 bg-indigo-600 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { q: 'How does the AI adaptation work?', a: 'Our CAROA engine analyzes your performance in real-time to adjust the difficulty and content of your learning path, ensuring you are always challenged but never overwhelmed.' },
            { q: 'Can I use EDU-REV on multiple devices?', a: 'Yes, our platform is fully responsive and can be accessed on desktops, tablets, and smartphones. Your progress is synced across all devices.' },
            { q: 'What kind of support do you offer?', a: 'We offer 24/7 email support for all users. Institutional clients have a dedicated account manager and priority support channels.' },
            { q: 'Are the certificates verifiable?', a: 'Absolutely. Every certificate comes with a unique ID and a QR code that can be scanned to verify its authenticity on our platform, secured by blockchain technology.' }
          ].map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors group"
            >
              <h4 className="font-bold text-white mb-3 text-lg flex items-center gap-3">
                <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full" />
                {faq.q}
              </h4>
              <p className="text-zinc-400 leading-relaxed">{faq.a}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Map Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="mt-32 rounded-3xl overflow-hidden border border-white/10 h-96 bg-gradient-to-b from-zinc-800 to-black"
      >
        <div className="w-full h-full flex items-center justify-center relative">
          <div className="text-center z-10">
            <MapPin size={48} className="text-indigo-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Our Location</h3>
            <p className="text-zinc-400">Neural Valley, CA 94000</p>
            <p className="text-sm text-zinc-500 mt-2">Building the future of AI-powered education</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}