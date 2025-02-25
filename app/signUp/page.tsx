"use client";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import SignUpSection from "@/components/SignUpSection";
import ExampleChat from "@/components/ExampleChat";

export default function Home() {
  return (
    <main className="container mx-auto justify-between px-4 py-8">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 10,
          duration: 0.1,
        }}
      >
        <Header />
      </motion.div>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-10 gap-8">
        <motion.div
          className="col-span-10 md:col-span-4"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 10,
            duration: 0.1,
          }}
        >
          <SignUpSection />
        </motion.div>
        <motion.div
          className="col-span-10 md:col-span-6"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 10,
            duration: 0.1,
          }}
        >
          <ExampleChat />
        </motion.div>
      </div>
    </main>
  );
}
