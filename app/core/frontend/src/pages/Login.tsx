import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, ArrowLeft } from "lucide-react";
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

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("login");
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();
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
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0b2046] to-slate-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 -left-10 w-72 h-72 bg-primary rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 -right-10 w-72 h-72 bg-secondary rounded-full filter blur-3xl animate-pulse"></div>
      </div>
      
      {/* Logo at top */}
      <div className="absolute top-0 left-0 w-full p-5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary via-secondary to-accent" />
          <div className="flex flex-col">
            <span className="text-xl font-bold text-white">42-Transcendence</span>
          </div>
        </div>
        <Button
          variant="ghost"
          className="text-white hover:bg-[#0b2046]/30"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </div>
      
      {/* Main card */}
      <div className="w-full max-w-md z-10">
        <Card className="border-2 border-[#0b2046]/50 bg-[#0b2046]/30 backdrop-blur-md shadow-xl overflow-hidden rounded-xl">
          <CardHeader className="space-y-6 flex flex-col items-center pt-8 pb-3">
            <div className="bg-[#0b2046]/30 p-2 rounded-full w-fit">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#0056d3] via-[#0056d3] to-[#0056d3]" />
            </div>
            
            {/* Cute rounded toggle for Sign In/Sign Up */}
            <Tabs defaultValue="login" onValueChange={setActiveTab} className="w-full">
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
                
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="w-full h-12 border-[#0b2046]/50 text-white hover:bg-[#0b2046]/50 bg-[#0b2046]/20 flex items-center justify-center rounded-lg"
                    disabled={isLoading}
                    onClick={() => handleOAuthLogin("Github")}
                  >
                    <Github className="h-6 w-6" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full h-12 border-[#0b2046]/50 text-white hover:bg-[#0b2046]/50 bg-[#0b2046]/20 font-bold text-lg rounded-lg" 
                    disabled={isLoading}
                    onClick={() => handleOAuthLogin("42")}
                  >
                    42
                  </Button>
                </div>
              </CardContent>
            </Tabs>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default Login; 