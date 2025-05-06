import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import "../styles/login.css";

const APP_NAME = import.meta.env.VITE_APP_NAME || "Transcendence";

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
  const [activeTab, setActiveTab] = useState<"login" | "register">("register");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const { login } = useAuth();

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
        
        const result = await login(formData.email, formData.password);
        
        if (result.error) {
          throw new Error(result.error);
        }

        toast({
          title: "Success!",
          description: "Login successful!",
          variant: "default",
        });

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

  const renderSignUpForm = () => (
    <div className="sign-in-container">
      <div className="simple-form-group">
        <input 
          name="username"
          value={formData.username}
          onChange={handleInputChange}
          placeholder="Username" 
          required 
          disabled={isLoading}
          className="simple-input"
        />
      </div>
      <div className="simple-form-group">
        <input 
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="Email" 
          type="email" 
          required 
          disabled={isLoading}
          className="simple-input"
        />
      </div>
      <div className="simple-form-group">
        <input 
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          type="password"
          placeholder="Password"
          required 
          disabled={isLoading}
          className="simple-input"
        />
      </div>
      <button 
        className="create-account-btn"
        disabled={isLoading}
        onClick={handleSubmit}
      >
        {isLoading ? "Creating account..." : "CREATE ACCOUNT"}
      </button>

      <div className="divider">
        <span>OR</span>
      </div>
      
      <button 
        className="google-btn"
        disabled={isLoading}
        onClick={() => console.log("Google login not implemented yet")}
      >
        <img src="/google.svg" alt="Google" />
        Continue with Google
      </button>
    </div>
  );

  const renderSignInForm = () => (
    <div className="sign-in-container">
      <div className="simple-form-group">
        <input 
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="Email" 
          type="email" 
          required 
          disabled={isLoading}
          className="simple-input"
        />
      </div>
      <div className="simple-form-group">
        <input 
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          type="password"
          placeholder="Password"
          required 
          disabled={isLoading}
          className="simple-input"
        />
      </div>
      <button
        className="create-account-btn" 
        disabled={isLoading}
        onClick={(e) => handleSubmit(e)}
        type="button"
      >
        {isLoading ? "Signing in..." : "SIGN IN"}
      </button>

      <div className="divider">
        <span>OR</span>
      </div>
      
      <button 
        className="google-btn"
        disabled={isLoading}
        onClick={() => console.log("Google login not implemented yet")}
      >
        <img src="/google.svg" alt="Google" />
        Continue with Google
      </button>
    </div>
  );

  return (
    <div className="login-container">
      <div className="login-navbar">
        <div className="login-navbar-brand">
          <div className="login-brand-logo">
            <span>P</span>
          </div>
          <span className="login-brand-text">{APP_NAME}</span>
        </div>
        <button
          className="login-back-button"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="button-icon" />
          Back to Home
        </button>
      </div>
      
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo"></div>
          
          <div className="tabs-container">
            <button 
              className={`tab-button ${activeTab === "login" ? "active" : ""}`}
              onClick={() => setActiveTab("login")}
              type="button"
            >
              Sign In
            </button>
            <button 
              className={`tab-button ${activeTab === "register" ? "active" : ""}`}
              onClick={() => setActiveTab("register")}
              type="button"
            >
              Sign Up
            </button>
          </div>
          
          {activeTab === "login" ? renderSignInForm() : renderSignUpForm()}
        </div>
      </div>
    </div>
  );
};

export default Login; 