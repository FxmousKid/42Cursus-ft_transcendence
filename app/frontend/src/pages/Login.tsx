import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/services/api";

const APP_NAME = import.meta.env.VITE_APP_NAME;

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
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>(initialFormData);

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
        console.log("Submitting registration to:", `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/auth/register`);
        console.log("Registration data:", formData);
        
        // Basic form validation
        if (!formData.username || !formData.email || !formData.password) {
          throw new Error("All fields are required");
        }
        
        if (formData.password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }
        
        const result = await api.auth.register(formData);
        console.log("Registration result:", result);
        
        if (result.error) {
          throw new Error(result.error);
        }

        toast({
          title: "Success!",
          description: "Account created successfully. Please log in.",
          variant: "default",
        });
        
        resetForm();
        setActiveTab("login");
      } else {
        console.log("Submitting login:", formData);
        
        // Basic login validation
        if (!formData.email || !formData.password) {
          throw new Error("Email and password are required");
        }
        
        const result = await api.auth.login(formData);
        console.log("Login result:", result);
        
        if (result.error) {
          throw new Error(result.error);
        }

        // Redirect to home page after successful login
        navigate("/");
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

  const renderForm = (type: "login" | "register") => (
    <form onSubmit={handleSubmit} className="space-y-5">
      {type === "register" && (
        <Input 
          name="username"
          value={formData.username}
          onChange={handleInputChange}
          placeholder="Username" 
          required 
          disabled={isLoading}
          className="bg-[#0b2046]/20 border-[#0b2046]/50 h-12 placeholder:text-[#0056d3]/70 text-white rounded-lg"
        />
      )}
      <Input 
        name="email"
        value={formData.email}
        onChange={handleInputChange}
        placeholder="Email" 
        type="email" 
        required 
        disabled={isLoading}
        className="bg-[#0b2046]/20 border-[#0b2046]/50 h-12 placeholder:text-[#0056d3]/70 text-white rounded-lg"
      />
      <Input 
        name="password"
        value={formData.password}
        onChange={handleInputChange}
        type="password"
        placeholder="Password"
        required 
        disabled={isLoading}
        className="bg-[#0b2046]/20 border-[#0b2046]/50 h-12 placeholder:text-[#0056d3]/70 text-white rounded-lg"
      />
      <Button 
        type="submit" 
        className="w-full h-12 font-bold text-lg bg-[#0056d3] hover:bg-[#0056d3]/80 rounded-lg" 
        disabled={isLoading}
      >
        {isLoading 
          ? (type === "login" ? "Signing in..." : "Creating account...") 
          : (type === "login" ? "Sign In" : "Create Account")}
      </Button>
    </form>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0b2046] to-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 -left-10 w-72 h-72 bg-primary rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-0 -right-10 w-72 h-72 bg-secondary rounded-full filter blur-3xl animate-pulse" />
      </div>
      
      <div className="absolute top-0 left-0 w-full p-5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary via-secondary to-accent" />
          <span className="text-xl font-bold text-white">{APP_NAME}</span>
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
      
      <div className="w-full max-w-md z-10">
        <Card className="border-2 border-[#0b2046]/50 bg-[#0b2046]/30 backdrop-blur-md shadow-xl overflow-hidden rounded-xl">
          <CardHeader className="space-y-6 flex flex-col items-center pt-8 pb-3">
            <div className="bg-[#0b2046]/30 p-2 rounded-full w-fit">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#0056d3] via-[#0056d3] to-[#0056d3]" />
            </div>
            
            <Tabs defaultValue="login" value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")} className="w-full">
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
                  {renderForm("login")}
                </TabsContent>
                
                <TabsContent value="register" className="mt-0">
                  {renderForm("register")}
                </TabsContent>
              
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#0b2046]/50" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#0b2046]/50 px-2 text-[#0056d3]">OR</span>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full h-12 border-[#0b2046]/50 text-white hover:bg-[#0b2046]/50 bg-[#0b2046]/20 flex items-center justify-center gap-2 rounded-lg"
                  disabled={isLoading}
                  onClick={() => console.log("Google login not implemented yet")}
                >
                  <img src="/google.svg" alt="Google" className="w-6 h-6" />
                  Continue with Google
                </Button>
              </CardContent>
            </Tabs>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default Login; 