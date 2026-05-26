import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Setting from '../models/Setting.js';
import Service from '../models/Service.js';
import Package from '../models/Package.js';
import Lead from '../models/Lead.js';
import Payment from '../models/Payment.js';
import Blog from '../models/Blog.js';
import Testimonial from '../models/Testimonial.js';
import Page from '../models/Page.js';
import Section from '../models/Section.js';
import Portfolio from '../models/Portfolio.js';
import { makeSlug } from './slugify.js';

const serviceDefs = [
  { title: 'Website Development', category: 'Engineering', price: 25000, featured: true },
  { title: 'Digital Marketing', category: 'Growth', price: 18000 },
  { title: 'SEO Services', category: 'Growth', price: 15000, featured: true },
  { title: 'Mobile App Development', category: 'Engineering', price: 85000 },
  { title: 'Cyber Security', category: 'Security', price: 35000 },
  { title: 'IT Support', category: 'Operations', price: 12000 },
  { title: 'UI/UX Design', category: 'Design', price: 22000 },
  { title: 'E-Commerce Development', category: 'Engineering', price: 55000 },
];

const packageTiers = [
  { name: 'Starter', price: 15000, duration: '15 days', features: ['Discovery call', 'Core deliverables', '1 revision round'] },
  { name: 'Standard', price: 35000, duration: '30 days', features: ['Strategy workshop', 'Premium execution', '2 revision rounds', 'Analytics setup'], popular: true },
  { name: 'Premium', price: 75000, duration: '60 days', features: ['Dedicated manager', 'Priority support', 'Advanced integrations', 'Monthly reporting'] },
];

const leadNames = ['Aarav Singh', 'Priya Mehta', 'Rohan Verma', 'Sneha Kapoor', 'Aditya Joshi', 'Isha Reddy', 'Karan Malhotra', 'Neha Shah'];
const sources = ['Contact Form', 'Service Inquiry', 'Chatbot', 'Pricing Checkout', 'Callback', 'WhatsApp'];
const statuses = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Converted', 'Lost'];

async function run() {
  await connectDB();

  const admin = await User.findOne({ email: process.env.ADMIN_SEED_EMAIL });
  if (!admin) {
    await User.create({
      name: process.env.ADMIN_SEED_NAME || 'Admin',
      email: process.env.ADMIN_SEED_EMAIL || 'admin@darotech.com',
      password: process.env.ADMIN_SEED_PASSWORD || 'admin123',
      role: 'admin',
    });
  }

  await Setting.findOneAndUpdate(
    {},
    {
      companyName: 'Darotech Technology',
      primaryColor: '#0A4DFF',
      secondaryColor: '#FF7A00',
      email: 'info@darotechtechnology.com',
      phone: '+91 72177 61115',
      whatsapp: '+91 72177 61115',
      address: 'B-340, Kapra colony, Near Air Force Road, Faridabad 121001',
      seoTitle: 'Darotech Technology — Premium IT & Growth Partner',
      seoDescription: 'Engineering the next generation of digital systems.',
      socialLinks: {
        facebook: 'https://facebook.com/darotech',
        instagram: 'https://instagram.com/darotech',
        linkedin: 'https://linkedin.com/company/darotech',
        twitter: 'https://twitter.com/darotech',
        youtube: 'https://youtube.com/@darotech',
      },
      payment: { mode: 'Test', currency: 'INR', taxPercentage: 18, invoicePrefix: 'DT-INV-' },
      chatbot: {
        welcomeMessage: "Hi! I'm Daro, your Darotech assistant. How can I help today?",
        quickReplies: ['Explore services', 'Get pricing', 'Talk to sales'],
        serviceText: 'We offer web, mobile, marketing, AI and security services.',
        pricingText: 'Packages start from ₹15,000. Want a custom quote?',
        handoffMessage: 'Share your email and our team will reach out within 24 hours.',
        enabled: true,
      },
    },
    { upsert: true, new: true },
  );

  const services = [];
  for (const def of serviceDefs) {
    const slug = makeSlug(def.title);
    const svc = await Service.findOneAndUpdate(
      { slug },
      {
        title: def.title,
        slug,
        category: def.category,
        status: 'Published',
        featured: !!def.featured,
        shortDescription: `Professional ${def.title} by Darotech Technology.`,
        fullDescription: `End-to-end ${def.title.toLowerCase()} with strategy, execution and measurable outcomes.`,
        priceStartingFrom: def.price,
        benefits: ['Dedicated project manager', 'Transparent milestones', 'Post-launch support'],
        processSteps: [
          { title: 'Discovery', description: 'Understand goals, users and constraints.' },
          { title: 'Build', description: 'Ship iteratively with weekly demos.' },
          { title: 'Launch', description: 'Go live with QA, analytics and handover.' },
        ],
        faqs: [
          { q: 'How long does it take?', a: 'Typical timelines range from 2–8 weeks depending on scope.' },
          { q: 'Do you offer support?', a: 'Yes — 30 days complimentary support is included.' },
        ],
        seoTitle: `${def.title} — Darotech`,
        seoDescription: `Hire Darotech for ${def.title.toLowerCase()}.`,
      },
      { upsert: true, new: true },
    );
    services.push(svc);

    for (const tier of packageTiers) {
      await Package.findOneAndUpdate(
        { service: svc._id, name: tier.name },
        {
          service: svc._id,
          serviceSlug: slug,
          name: tier.name,
          price: tier.price + (def.price % 5000),
          duration: tier.duration,
          features: tier.features,
          isPopular: !!tier.popular,
          status: 'Active',
          ctaText: 'Get Started',
        },
        { upsert: true, new: true },
      );
    }
  }

  if ((await Lead.countDocuments()) < 5) {
    const leads = leadNames.map((name, i) => ({
      name,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      phone: `+91 98${String(10000000 + i * 111111).slice(0, 8)}`,
      service: serviceDefs[i % serviceDefs.length].title,
      source: sources[i % sources.length],
      budget: ['< ₹50k', '₹50k–₹1L', '₹1L–₹5L'][i % 3],
      status: statuses[i % statuses.length],
      notes: i % 2 === 0 ? 'Interested in Q1 launch.' : undefined,
      createdAt: new Date(Date.now() - i * 86400000 * 2),
    }));
    await Lead.insertMany(leads);
  }

  if ((await Payment.countDocuments()) < 3) {
    const payments = [
      { customerName: 'Priya Mehta', email: 'priya@example.com', service: 'Website Development', package: 'Standard', amount: 35000, status: 'Paid', gateway: 'Manual', transactionId: 'txn_seed_001', paymentDate: new Date() },
      { customerName: 'Rohan Verma', email: 'rohan@example.com', service: 'SEO Services', package: 'Starter', amount: 15000, status: 'Pending', gateway: 'Razorpay', transactionId: 'txn_seed_002' },
      { customerName: 'Sneha Kapoor', email: 'sneha@example.com', service: 'Mobile App Development', package: 'Premium', amount: 75000, status: 'Paid', gateway: 'Stripe', transactionId: 'txn_seed_003', paymentDate: new Date(Date.now() - 86400000 * 5) },
      { customerName: 'Aditya Joshi', email: 'aditya@example.com', service: 'Digital Marketing', package: 'Standard', amount: 35000, status: 'Failed', gateway: 'Razorpay', transactionId: 'txn_seed_004' },
    ];
    for (const p of payments) {
      await Payment.findOneAndUpdate(
        { transactionId: p.transactionId },
        { ...p, invoiceNo: `DT-INV-SEED-${p.transactionId}` },
        { upsert: true, new: true },
      );
    }
  }

  const blogPosts = [
    { title: 'Why Performance Marketing Beats Brand Spend in 2026', category: 'Marketing', shortDescription: 'Data-driven funnels outperform awareness spend.', tags: ['marketing', 'growth'] },
    { title: 'The SEO Stack We Use to Rank in Under 90 Days', category: 'SEO', shortDescription: 'Technical SEO + content velocity framework.', tags: ['seo'] },
    { title: 'Native vs Cross-Platform Apps: 2026 Guide', category: 'Mobile', shortDescription: 'Flutter, React Native or native — how to choose.', tags: ['mobile'] },
  ];
  for (const b of blogPosts) {
    const slug = makeSlug(b.title);
    await Blog.findOneAndUpdate(
      { slug },
      { ...b, slug, status: 'Published', author: admin?._id, publishDate: new Date(), content: `${b.shortDescription}\n\nFull article content placeholder.`, seoTitle: b.title, seoDescription: b.shortDescription },
      { upsert: true, new: true },
    );
  }

  const testimonials = [
    { clientName: 'Rajesh Sharma', company: 'Sharma Retail', rating: 5, reviewText: 'Darotech rebuilt our store and conversions jumped 62%.', serviceUsed: 'Website Development', status: 'Approved' },
    { clientName: 'Dr. Ananya Patel', company: 'Wellnest Clinic', rating: 5, reviewText: 'Patient booking app is fast, beautiful and reliable.', serviceUsed: 'Mobile App Development', status: 'Approved' },
    { clientName: 'Vikram Iyer', company: 'Logistico', rating: 4, reviewText: 'CRM saved our ops team 25 hours every week.', serviceUsed: 'IT Support', status: 'Approved' },
  ];
  for (const t of testimonials) {
    await Testimonial.findOneAndUpdate({ clientName: t.clientName, company: t.company }, t, { upsert: true, new: true });
  }

  const pages = [
    { title: 'About Us', slug: 'about', content: 'Darotech Technology builds premium digital systems.', status: 'Published' },
    { title: 'Privacy Policy', slug: 'privacy', content: 'Your privacy matters to Darotech.', status: 'Published' },
  ];
  for (const p of pages) {
    await Page.findOneAndUpdate({ slug: p.slug }, { ...p, seoTitle: p.title, seoDescription: p.content }, { upsert: true, new: true });
  }

  const sections = [
    { key: 'home-hero', title: 'Engineering the Next Generation', subtitle: 'Darotech Technology', description: 'Premium websites, apps and growth systems.', status: 'Visible', sortOrder: 1 },
    { key: 'home-cta', title: 'Ready to scale?', subtitle: 'Free consultation', description: 'Book a 30-minute strategy call.', buttonText: 'Contact Us', buttonLink: '/contact', status: 'Visible', sortOrder: 2 },
  ];
  for (const s of sections) {
    await Section.findOneAndUpdate({ key: s.key }, s, { upsert: true, new: true });
  }

  const portfolioItems = [
    { title: 'Sharma Retail — Headless Commerce', client: 'Sharma Retail', category: 'E-Commerce', description: 'Headless storefront with +62% conversion lift.', results: ['+62% conversion', 'Sub-2s LCP'] },
    { title: 'Wellnest — Patient Booking App', client: 'Wellnest', category: 'Healthcare', description: '120k+ monthly bookings on mobile.', results: ['120k bookings/mo', '4.8★ rating'] },
    { title: 'Logistico — Operations CRM', client: 'Logistico', category: 'Logistics', description: 'Unified ops dashboard for fleet teams.', results: ['−25 hrs/week manual work'] },
  ];
  for (const item of portfolioItems) {
    const slug = makeSlug(item.title);
    await Portfolio.findOneAndUpdate({ slug }, { ...item, slug, status: 'Published' }, { upsert: true, new: true });
  }

  console.log('Seed complete — admin, settings, services, packages, leads, payments, blogs, testimonials, pages, sections, portfolio');
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
