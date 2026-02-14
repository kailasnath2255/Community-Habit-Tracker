'use client';

import Link from 'next/link';
import { ArrowRight, BarChart3, Flame, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Flame className="w-8 h-8 text-amber-400" />
              <span className="text-xl font-bold gradient-text">Habit Tracker</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth/login" className="text-sm font-medium hover:text-primary transition">
                Login
              </Link>
              <Link
                href="/auth/signup"
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/50 transition font-medium text-white"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.div
        className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={item} className="text-center mb-16">
          <h1 className="text-5xl sm:text-7xl font-bold mb-6 gradient-text leading-tight">
            Build Better Habits Together
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Track your daily habits with real-time community updates. Get intelligent streak predictions and stay motivated with friends.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/auth/signup"
              className="px-8 py-3 rounded-lg bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/50 transition font-medium text-white flex items-center gap-2"
            >
              Start Free <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="px-8 py-3 rounded-lg border border-white/20 hover:border-white/40 transition font-medium">
              Watch Demo
            </button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div variants={item} className="grid md:grid-cols-3 gap-6 mt-20">
          {[
            {
              icon: Flame,
              title: 'Streak Tracking',
              description: 'Build unbreakable streaks and watch your progress grow day by day.',
            },
            {
              icon: BarChart3,
              title: 'Smart Prediction',
              description: 'AI-powered predictions show your likely streak continuation chance.',
            },
            {
              icon: Users,
              title: 'Live Community',
              description: 'See when others complete habits and celebrate wins together in real-time.',
            },
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              variants={item}
              className="p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
            >
              <feature.icon className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* CTA Section */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative py-20 px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl"
      >
        <motion.div
          variants={item}
          className="rounded-2xl border border-white/10 bg-gradient-to-r from-primary/10 to-secondary/10 p-12 text-center"
        >
          <h2 className="text-3xl font-bold mb-4">Ready to transform your habits?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of users who are building better habits and achieving their goals together.
          </p>
          <Link
            href="/auth/signup"
            className="inline-block px-8 py-3 rounded-lg bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/50 transition font-medium text-white"
          >
            Join the Community
          </Link>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4 sm:px-6 lg:px-8 mt-20">
        <div className="mx-auto max-w-7xl text-center text-muted-foreground text-sm">
          <p>&copy; 2024 Community Habit Tracker. Built with ❤️ for habit builders.</p>
        </div>
      </footer>
    </div>
  );
}
