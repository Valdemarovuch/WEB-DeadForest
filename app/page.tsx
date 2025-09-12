import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Sparkles, Shield, Zap } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-balance">
                Welcome to <span className="text-primary">DeadForest</span>
              </h1>
              <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto text-balance">
                Discover unique digital products that combine <span className="text-primary">efficiency</span>,{" "}
                <span className="text-primary">aesthetics</span>, and{" "}
                <span className="text-primary">functionality</span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="text-lg px-8">
                <Link href="/store">
                  Explore Store <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 bg-transparent">
                Learn More
              </Button>
            </div>
          </div>
        </div>

        {/* Holographic Effect */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-accent/5 rounded-full blur-2xl animate-pulse delay-1000" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-balance">Why Choose DeadForest?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
              Our work includes identifying and emphasizing key aspects of the brand, showing character and emotions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-card/50 backdrop-blur border-border/50 hover:bg-card/80 transition-colors">
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Digital Artist</h3>
                <p className="text-muted-foreground">
                  Creating unique digital content that stands out in the modern landscape
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border/50 hover:bg-card/80 transition-colors">
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Product Design</h3>
                <p className="text-muted-foreground">
                  Crafting user experiences that are both beautiful and functional
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border/50 hover:bg-card/80 transition-colors">
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">UI/UX Design</h3>
                <p className="text-muted-foreground">
                  Designing interfaces that prioritize usability and visual appeal
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-balance">Ready to explore our collection?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
              Discover products that will elevate your digital presence and creative workflow
            </p>
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/store">
                Browse Products <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="text-2xl font-bold">
                Dead<span className="text-primary">Forest</span>
              </div>
              <p className="text-sm text-muted-foreground">Creating digital experiences that inspire and engage.</p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Quick Links</h4>
              <div className="space-y-2 text-sm">
                <Link href="/" className="block text-muted-foreground hover:text-primary transition-colors">
                  Home
                </Link>
                <Link href="/store" className="block text-muted-foreground hover:text-primary transition-colors">
                  Store
                </Link>
                <Link href="/admin" className="block text-muted-foreground hover:text-primary transition-colors">
                  Admin
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Support</h4>
              <div className="space-y-2 text-sm">
                <Link href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </Link>
                <Link href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                  FAQ
                </Link>
                <Link href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                  Help
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Connect</h4>
              <p className="text-sm text-muted-foreground">Follow us for updates and new releases</p>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2025 DeadForest. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
