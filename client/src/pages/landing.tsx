import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <Navigation showAuthButton={true} />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-background to-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                Preserving the
                <span className="text-primary"> World's Languages </span>
                for Future Generations
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Over 40% of the world's 6,000+ languages are at risk of disappearing. Join our global community in documenting, learning, and preserving endangered languages through AI-powered tools and collaborative efforts.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="px-8 py-4" 
                  onClick={handleLogin}
                  data-testid="button-start-learning"
                >
                  <i className="fas fa-play-circle mr-2"></i>
                  Get Started
                </Button>
                <Button 
                  variant="secondary" 
                  size="lg" 
                  className="px-8 py-4"
                  onClick={handleLogin}
                  data-testid="button-learn-more"
                >
                  <i className="fas fa-info-circle mr-2"></i>
                  Learn More
                </Button>
              </div>
              
              <div className="mt-12 grid grid-cols-3 gap-8">
                <div className="text-center" data-testid="stat-languages">
                  <div className="text-2xl font-bold text-primary">2,000+</div>
                  <div className="text-sm text-muted-foreground">Languages</div>
                </div>
                <div className="text-center" data-testid="stat-contributors">
                  <div className="text-2xl font-bold text-primary">50K+</div>
                  <div className="text-sm text-muted-foreground">Contributors</div>
                </div>
                <div className="text-center" data-testid="stat-samples">
                  <div className="text-2xl font-bold text-primary">1M+</div>
                  <div className="text-sm text-muted-foreground">Audio Samples</div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Diverse group of people collaborating on language preservation" 
                className="rounded-xl shadow-2xl w-full h-auto"
                data-testid="img-hero"
              />
              <Card className="absolute -bottom-6 -left-6 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      <i className="fas fa-volume-up text-primary-foreground"></i>
                    </div>
                    <div>
                      <div className="font-semibold text-sm">AI-Powered Learning</div>
                      <div className="text-xs text-muted-foreground">Speech recognition & synthesis</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Why LanguaLegacy?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our platform combines cutting-edge AI technology with community collaboration to create the most comprehensive language preservation system.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow" data-testid="card-discover">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-search text-2xl text-primary"></i>
                </div>
                <h3 className="text-xl font-semibold mb-2">Discover Languages</h3>
                <p className="text-muted-foreground">
                  Explore over 2,000 endangered languages with detailed information about speakers, regions, and threat levels.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow" data-testid="card-learn">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-graduation-cap text-2xl text-accent"></i>
                </div>
                <h3 className="text-xl font-semibold mb-2">Interactive Learning</h3>
                <p className="text-muted-foreground">
                  Learn through gamified lessons with AI-powered pronunciation guides and cultural context.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow" data-testid="card-contribute">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-microphone text-2xl text-foreground"></i>
                </div>
                <h3 className="text-xl font-semibold mb-2">Contribute Content</h3>
                <p className="text-muted-foreground">
                  Help preserve languages by contributing audio recordings, translations, and cultural knowledge.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-secondary/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Join the Movement
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Every contribution matters. Help us preserve the world's linguistic heritage for future generations.
          </p>
          <Button 
            size="lg" 
            className="px-8 py-4" 
            onClick={handleLogin}
            data-testid="button-join-now"
          >
            <i className="fas fa-users mr-2"></i>
            Join Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <i className="fas fa-globe-americas text-2xl text-primary"></i>
                <span className="text-xl font-bold text-foreground">LanguaLegacy</span>
              </div>
              <p className="text-muted-foreground mb-4 max-w-md">
                Preserving the world's endangered languages through community collaboration and AI-powered tools. Every voice matters in keeping our linguistic heritage alive.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-muted-foreground hover:text-primary" data-testid="link-twitter">
                  <i className="fab fa-twitter text-xl"></i>
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary" data-testid="link-facebook">
                  <i className="fab fa-facebook text-xl"></i>
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary" data-testid="link-instagram">
                  <i className="fab fa-instagram text-xl"></i>
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary" data-testid="link-github">
                  <i className="fab fa-github text-xl"></i>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Platform</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-primary" data-testid="link-discover">Discover Languages</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary" data-testid="link-learn">Start Learning</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary" data-testid="link-contribute">Contribute Content</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary" data-testid="link-community">Community</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-primary" data-testid="link-docs">Documentation</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary" data-testid="link-api">API</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary" data-testid="link-research">Research</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary" data-testid="link-support">Support</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center">
            <p className="text-muted-foreground" data-testid="text-copyright">
              © 2024 LanguaLegacy. Supporting UNESCO's Decade of Indigenous Languages 2022-2032.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
