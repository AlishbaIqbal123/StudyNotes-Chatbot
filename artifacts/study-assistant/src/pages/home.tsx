import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, Zap, Layers, Sparkles, Quote, CheckCircle2 } from "lucide-react";

export function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center text-center px-4 py-32 bg-mesh">
        {/* Floating Orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-[120px] animate-float" style={{ animationDelay: "1s" }} />

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 max-w-4xl space-y-8"
        >
          <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary backdrop-blur-sm">
            <Sparkles className="mr-2 h-4 w-4" />
            The Premium AI Learning Companion
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-foreground leading-[1.1]">
            Upload anything. <br />
            <span className="gradient-text animate-gradient-shift bg-[length:200%_auto]">
              Understand everything.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium">
            Transform lectures, notes, and documents into beautifully interactive study guides, flashcards, and quizzes in seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 h-14 rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5">
                Start Learning Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 h-14 rounded-full bg-background/50 backdrop-blur-sm border-primary/20 hover:bg-primary/5">
                Sign In
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Stats Row */}
      <section className="py-12 border-y border-border/50 bg-muted/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-border/50">
          <div className="pt-4 md:pt-0">
            <p className="text-4xl font-bold gradient-text">10,000+</p>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mt-1">Active Students</p>
          </div>
          <div className="pt-4 md:pt-0">
            <p className="text-4xl font-bold gradient-text">500,000+</p>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mt-1">Flashcards Generated</p>
          </div>
          <div className="pt-4 md:pt-0">
            <p className="text-4xl font-bold gradient-text">4.9/5</p>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mt-1">Average Rating</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-32 bg-background relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">How it works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">From messy notes to mastery in three simple steps.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-primary/10 via-primary/40 to-primary/10 -z-10" />
            
            {[
              { step: "01", title: "Upload Material", desc: "Paste text, drop a PDF, or link a YouTube video." },
              { step: "02", title: "AI Processing", desc: "Aura analyzes and structures your content intelligently." },
              { step: "03", title: "Start Learning", desc: "Review notes, flip flashcards, and take practice quizzes." }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                className="relative flex flex-col items-center text-center"
              >
                <div className="w-24 h-24 rounded-full bg-background border-4 border-background shadow-xl flex items-center justify-center mb-8 relative z-10">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">{item.step}</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-32 bg-muted/10 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">A complete learning suite</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Everything you need to study effectively, powered by advanced AI.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Smart Notes",
                description: "Automatically extracts key concepts, definitions, and summaries from your uploaded materials with beautiful formatting.",
                icon: Layers,
                gradient: "from-blue-500/20 to-cyan-500/20 text-blue-500"
              },
              {
                title: "Interactive Quizzes",
                description: "Test your knowledge with auto-generated multiple choice questions based on your specific content to ensure mastery.",
                icon: Brain,
                gradient: "from-primary/20 to-purple-500/20 text-primary"
              },
              {
                title: "Instant Flashcards",
                description: "Flip through auto-generated flashcards to memorize important facts and definitions quickly with spaced repetition style UI.",
                icon: Zap,
                gradient: "from-amber-500/20 to-orange-500/20 text-amber-500"
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="glass rounded-3xl p-8 card-hover flex flex-col items-center text-center relative overflow-hidden group"
              >
                <div className={`p-5 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                  <feature.icon className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 bg-background px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">What students say</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-muted/30 rounded-3xl p-10 border border-border/50 relative"
            >
              <Quote className="absolute top-6 left-6 text-primary/10 w-16 h-16 -z-10" />
              <p className="text-xl font-medium leading-relaxed mb-6">"Aura Study changed how I prepare for exams. I literally paste my professor's lecture transcripts and get an entire study guide back. It feels like magic."</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">SJ</div>
                <div>
                  <p className="font-bold">Sarah Jenkins</p>
                  <p className="text-sm text-muted-foreground">Medical Student</p>
                </div>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-muted/30 rounded-3xl p-10 border border-border/50 relative"
            >
              <Quote className="absolute top-6 left-6 text-primary/10 w-16 h-16 -z-10" />
              <p className="text-xl font-medium leading-relaxed mb-6">"The UI is gorgeous. It actually makes me want to study. The flashcards are super smooth and the quizzes help me figure out what I actually know."</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center text-accent-foreground font-bold">MK</div>
                <div>
                  <p className="font-bold">Marcus Kim</p>
                  <p className="text-sm text-muted-foreground">Computer Science Major</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-4">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border border-primary/20 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-mesh opacity-30" />
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative z-10"
          >
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">Ready to ace your next exam?</h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">Join thousands of students learning faster and smarter with Aura Study.</p>
            <Link href="/signup">
              <Button size="lg" className="text-lg px-10 h-16 rounded-full shadow-xl shadow-primary/30 hover:scale-105 transition-transform">
                Get Started Now
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
