import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Terminal } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";

interface FormData {
  username: string;
  email: string;
  password: string;
}

const initialFormData: FormData = {
  username: "",
  email: "",
  password: ""
};

// Détection de l'environnement de développement
const isDevelopmentEnv = import.meta.env.DEV || import.meta.env.MODE === 'development';

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("login");
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, toggleDevMode, isDevMode } = useAuth();
  const { toast } = useToast();
  
  // Get the 'from' location from router state or default to home page
  const from = (location.state as { from?: string })?.from || "/";
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (activeTab === "register") {
        // Basic form validation
        if (!formData.username || !formData.email || !formData.password) {
          throw new Error("All fields are required");
        }
        
        if (formData.password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }
        
        await register(formData.username, formData.email, formData.password);
        
        toast({
          title: "Success!",
          description: "Account created successfully. Please log in.",
        });
        
        // Réinitialiser le formulaire et passer à l'onglet login
        resetForm();
        setActiveTab("login");
      } else {
        // Basic login validation
        if (!formData.email || !formData.password) {
          throw new Error("Email and password are required");
        }
        
        const result = await login(formData.email, formData.password);
        
        if (result && result.error) {
          throw new Error(result.error);
        }

        toast({
          title: "Success!",
          description: "Login successful!",
        });

        // Redirect to the original page the user was trying to access or home page
        navigate(from);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOAuthLogin = (provider: string) => {
    toast({
      title: "Info",
      description: `${provider} login not implemented yet`,
    });
  };

  const handleDevModeToggle = () => {
    toggleDevMode();
    
    if (!isDevMode) { // Vérifie l'état actuel avant le basculement
      toast({
        title: "Mode Développeur Activé",
        description: "Vous êtes maintenant automatiquement connecté en mode développement.",
      });
      
      // Redirection vers la page d'accueil après activation du mode dev
      navigate(from);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0b2046] to-slate-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 -left-10 w-72 h-72 bg-primary rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 -right-10 w-72 h-72 bg-secondary rounded-full filter blur-3xl animate-pulse"></div>
      </div>
      
      {/* Logo at top - centered */}
      <div className="absolute top-0 left-0 w-full p-5 flex justify-center items-center">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-primary/80 absolute inset-0 logo-glow"></div>
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary via-secondary to-accent relative z-10 logo-breathe">
              <div className="logo-inner-light"></div>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-white">42-Transcendence</span>
          </div>
        </div>
      </div>
      
      {/* Main card */}
      <div className="w-full max-w-md z-10">
        <Card className="border-2 border-[#0b2046]/50 bg-[#0b2046]/30 backdrop-blur-md shadow-xl overflow-hidden rounded-xl">
          <CardHeader className="space-y-6 flex flex-col items-center pt-8 pb-3">
            <div className="bg-[#0b2046]/30 p-2 rounded-full w-fit relative">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#0056d3] via-[#0056d3] to-[#0056d3] relative z-10 logo-breathe">
                <div className="logo-inner-light"></div>
              </div>
              <div className="h-10 w-10 rounded-full bg-[#0056d3]/80 absolute inset-0 logo-glow"></div>
            </div>
            
            {/* Cute rounded toggle for Sign In/Sign Up */}
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full max-w-[250px] grid-cols-2 mx-auto rounded-full p-1 bg-[#0b2046]/20 border border-[#0b2046]/30">
                <TabsTrigger 
                  value="login" 
                  className="text-sm font-bold rounded-full h-9 data-[state=active]:bg-[#0056d3] data-[state=active]:text-white data-[state=inactive]:text-[#0056d3]/70 transition-all"
                >
                  SIGN IN
                </TabsTrigger>
                <TabsTrigger 
                  value="register" 
                  className="text-sm font-bold rounded-full h-9 data-[state=active]:bg-[#0056d3] data-[state=active]:text-white data-[state=inactive]:text-[#0056d3]/70 transition-all"
                >
                  SIGN UP
                </TabsTrigger>
              </TabsList>
              
              <CardContent className="pt-6 px-6">
                <TabsContent value="login" className="mt-0">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Input 
                        id="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Email" 
                        type="email" 
                        required 
                        disabled={isLoading}
                        className="bg-[#0b2046]/20 border-[#0b2046]/50 h-12 placeholder:text-[#0056d3]/70 text-white rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Input 
                        id="password" 
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        type="password"
                        placeholder="Password"
                        required 
                        disabled={isLoading}
                        className="bg-[#0b2046]/20 border-[#0b2046]/50 h-12 placeholder:text-[#0056d3]/70 text-white rounded-lg"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-12 font-bold text-lg bg-[#0056d3] hover:bg-[#0056d3]/80 rounded-lg" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="register" className="mt-0">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Input 
                        id="username" 
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        placeholder="Username" 
                        required 
                        disabled={isLoading}
                        className="bg-[#0b2046]/20 border-[#0b2046]/50 h-12 placeholder:text-[#0056d3]/70 text-white rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Input 
                        id="register-email" 
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Email" 
                        type="email" 
                        required 
                        disabled={isLoading}
                        className="bg-[#0b2046]/20 border-[#0b2046]/50 h-12 placeholder:text-[#0056d3]/70 text-white rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Input 
                        id="register-password" 
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        type="password"
                        placeholder="Password"
                        required 
                        disabled={isLoading}
                        className="bg-[#0b2046]/20 border-[#0b2046]/50 h-12 placeholder:text-[#0056d3]/70 text-white rounded-lg"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-12 font-bold text-lg bg-[#0056d3] hover:bg-[#0056d3]/80 rounded-lg" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </TabsContent>
              
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#0b2046]/50"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#0b2046]/50 px-2 text-[#0056d3]">
                      OR
                    </span>
                  </div>
                </div>
                
                {/* Single Google button replacing the previous two buttons */}
                <div className="flex justify-center">
                  <Button 
                    variant="outline" 
                    className="w-full h-12 border-[#0b2046]/50 text-white hover:bg-[#0b2046]/50 bg-[#0b2046]/20 flex items-center justify-center gap-2 rounded-lg"
                    disabled={isLoading}
                    onClick={() => handleOAuthLogin("Google")}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Sign in with Google
                  </Button>
                </div>
              </CardContent>
            </Tabs>
          </CardHeader>
        </Card>
      </div>
      
      {/* Back to Home button - now below the card */}
      <Button
        variant="ghost"
        className="text-white hover:bg-[#0b2046]/30 absolute bottom-10"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Button>
      
      {/* Dev Mode Toggle Button - affichage conditionnel selon l'environnement */}
      {isDevelopmentEnv && (
        <Button
          variant="ghost"
          size="sm"
          className={`absolute bottom-4 right-4 opacity-30 hover:opacity-100 transition-opacity ${isDevMode ? 'bg-amber-700/30 text-amber-400' : 'text-gray-500'}`}
          onClick={handleDevModeToggle}
        >
          <Terminal className="w-4 h-4 mr-1" />
          {isDevMode ? "Dev Mode ON" : "Dev Mode"}
        </Button>
      )}
    </div>
  );
};

export default Login; 