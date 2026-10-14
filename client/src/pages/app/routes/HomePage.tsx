import {
  Check,
  Github,
  Zap,
  Shield,
  Code,
  Database,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function StarterKitLanding() {
  const techStack = {
    frontend: [
      { name: "React", desc: "Modern UI library" },
      { name: "shadcn/ui", desc: "Beautiful components" },
      { name: "Tailwind CSS", desc: "Utility-first styling" },
      { name: "React Router DOM", desc: "Client-side routing" },
      { name: "Redux Toolkit", desc: "State management" },
    ],
    backend: [
      { name: "Node.js", desc: "Runtime environment" },
      { name: "Drizzle ORM", desc: "Type-safe database" },
      { name: "PostgreSQL", desc: "Reliable database" },
      { name: "OAuth", desc: "Social authentication" },
      { name: "Email/OTP", desc: "Secure verification" },
    ],
  };

  const features = [
    {
      icon: Shield,
      title: "Complete Authentication",
      description:
        "OAuth integration with Google and Facebook, email verification, OTP handling, and secure password management out of the box.",
    },
    {
      icon: Zap,
      title: "Production Ready",
      description:
        "Built with industry-standard tools and best practices. Skip the boilerplate and start building features immediately.",
    },
    {
      icon: Code,
      title: "Type-Safe Stack",
      description:
        "Drizzle ORM provides end-to-end type safety from database to frontend, catching errors before they happen.",
    },
    {
      icon: Database,
      title: "Scalable Architecture",
      description:
        "PostgreSQL database with Drizzle migrations, Redux for state management, and modular component structure.",
    },
  ];

  const benefits = [
    "Save 40+ hours of initial setup time",
    "Pre-configured authentication flows",
    "Type-safe database with migrations",
    "Beautiful UI components ready to use",
    "Email and OTP verification built-in",
    "Social login with Google & Facebook",
    "Secure password handling",
    "Redux state management configured",
    "React Router setup with protected routes",
    "Production-ready folder structure",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center space-y-6 mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            Full-Stack Starter Kit
          </div>
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            React + Node.js
            <br />
            Starter Kit
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            A production-ready full-stack starter kit with authentication,
            database, and modern UI. Stop configuring, start building.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Github className="w-5 h-5 mr-2" />
              Get Started
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-20">
          {features.map((feature, idx) => (
            <Card
              key={idx}
              className="bg-slate-900/50 border-slate-800 backdrop-blur"
            >
              <CardHeader>
                <feature.icon className="w-10 h-10 text-blue-400 mb-2" />
                <CardTitle className="text-white">{feature.title}</CardTitle>
                <CardDescription className="text-slate-400">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Tech Stack Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">
            Built with <span className="text-blue-400">Modern Tools</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Code className="w-5 h-5 text-blue-400" />
                  Frontend
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {techStack.frontend.map((tech, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                  >
                    <span className="font-medium text-white">{tech.name}</span>
                    <span className="text-sm text-slate-400">{tech.desc}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-purple-400" />
                  Backend
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {techStack.backend.map((tech, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                  >
                    <span className="font-medium text-white">{tech.name}</span>
                    <span className="text-sm text-slate-400">{tech.desc}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">
            What's <span className="text-purple-400">Included</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {benefits.map((benefit, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-4 bg-slate-900/50 border border-slate-800 rounded-lg"
              >
                <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-300">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center space-y-6 py-20">
          <h2 className="text-4xl font-bold">Ready to Build?</h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Clone the repository and have a production-ready app running in
            minutes.
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <Github className="w-5 h-5 mr-2" />
            Clone Repository
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 py-8">
        <div className="container mx-auto px-4 text-center text-slate-500">
          <p>Built with ❤️ using the best tools in the ecosystem</p>
        </div>
      </div>
    </div>
  );
}
