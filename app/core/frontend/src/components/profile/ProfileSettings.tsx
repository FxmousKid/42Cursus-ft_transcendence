import { useState, useEffect } from 'react';
import { Edit, LogOut, Lock, User as UserIcon, Mail, Eye, EyeOff, Shield, Pencil, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { UserProfileData } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface ProfileSettingsProps {
  profile: UserProfileData;
  onSaveProfile: (data: { username?: string; email?: string; password?: string }) => Promise<void>;
  onLogout: () => void;
  onDeleteAccount?: () => void;
}

const ProfileSettings = ({ profile, onSaveProfile, onLogout, onDeleteAccount }: ProfileSettingsProps) => {
  const { logout } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    username: profile.username,
    email: profile.email,
    password: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [editMode, setEditMode] = useState({
    username: false,
    email: false,
    password: false
  });
  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: ''
  });
  
  // Update form data when profile changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      username: profile.username,
      email: profile.email,
    }));
  }, [profile]);
  
  // Détection des changements
  useEffect(() => {
    const hasUsernameChange = formData.username !== profile.username;
    const hasEmailChange = formData.email !== profile.email;
    const hasPasswordChange = formData.password.trim() !== '';
    
    setHasChanges(hasUsernameChange || hasEmailChange || hasPasswordChange);
  }, [formData, profile]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    
    // Clear errors when user types
    setErrors(prev => ({ ...prev, [id]: '' }));
  };
  
  const toggleEditMode = (field: 'username' | 'email' | 'password') => {
    setEditMode(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
    
    // Clear errors when toggling edit mode
    setErrors(prev => ({ ...prev, [field]: '' }));
  };
  
  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...errors };
    
    // Validate username
    if (formData.username !== profile.username) {
      if (formData.username.trim().length < 3) {
        newErrors.username = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
        isValid = false;
      }
    }
    
    // Validate email
    if (formData.email !== profile.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Veuillez saisir une adresse email valide';
        isValid = false;
      }
    }
    
    // Validate password if provided
    if (formData.password.trim() !== '') {
      if (formData.password.length < 6) {
        newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
        isValid = false;
      }
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  const handleSubmit = async () => {
    if (!hasChanges) return;
    
    // Validate form before submission
    if (!validateForm()) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez corriger les erreurs dans le formulaire",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const updatedData = {
        username: formData.username !== profile.username ? formData.username : undefined,
        email: formData.email !== profile.email ? formData.email : undefined,
        password: formData.password ? formData.password : undefined,
      };
      
      await onSaveProfile(updatedData);
      
      // Reset password field and edit modes after successful submission
      setFormData(prev => ({ ...prev, password: '' }));
      setEditMode({
        username: false,
        email: false,
        password: false
      });
      
      toast({
        title: "Succès",
        description: "Vos informations ont été mises à jour",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la mise à jour",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    onLogout();
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-1">Paramètres du compte</h2>
        <p className="text-white/50">Gérez vos informations personnelles</p>
      </div>
      
      {/* Settings form */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Account section */}
        <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          <div className="border-b border-white/10 p-4">
            <h3 className="flex items-center text-lg font-medium">
              <UserIcon className="h-5 w-5 mr-2 text-gray-400" />
              Profil
            </h3>
          </div>
          
          <div className="p-5 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white/70 text-sm">Nom d'utilisateur</Label>
              <div className="relative">
                <Input
                  id="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={!editMode.username}
                  className={`bg-black/30 border-white/10 focus-visible:ring-blue-500 focus-visible:border-blue-500 pl-10 ${editMode.username ? '' : 'opacity-80'} ${errors.username ? 'border-red-500' : ''}`}
                />
                <UserIcon className="absolute left-3 top-2.5 h-5 w-5 text-white/30" />
                <button 
                  type="button"
                  onClick={() => toggleEditMode('username')}
                  className="absolute right-3 top-2.5 text-white/30 hover:text-blue-400 transition-colors"
                  aria-label="Éditer le nom d'utilisateur"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
              {errors.username && (
                <p className="text-xs text-red-500 mt-1">{errors.username}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/70 text-sm">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!editMode.email}
                  className={`bg-black/30 border-white/10 focus-visible:ring-blue-500 focus-visible:border-blue-500 pl-10 ${editMode.email ? '' : 'opacity-80'} ${errors.email ? 'border-red-500' : ''}`}
                />
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-white/30" />
                <button 
                  type="button"
                  onClick={() => toggleEditMode('email')}
                  className="absolute right-3 top-2.5 text-white/30 hover:text-blue-400 transition-colors"
                  aria-label="Éditer l'email"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </div>
          </div>
        </div>
      
        {/* Security section */}
        <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          <div className="border-b border-white/10 p-4">
            <h3 className="flex items-center text-lg font-medium">
              <Shield className="h-5 w-5 mr-2 text-gray-400" />
              Sécurité
            </h3>
          </div>
          
          <div className="p-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/70 text-sm">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Laisser vide pour ne pas changer"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={!editMode.password}
                  className={`bg-black/30 border-white/10 focus-visible:ring-blue-500 focus-visible:border-blue-500 pl-10 pr-10 ${editMode.password ? '' : 'opacity-80'} ${errors.password ? 'border-red-500' : ''}`}
                />
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-white/30" />
                <div className="absolute right-3 top-2.5 flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-white/30 hover:text-white/70 transition-colors"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? 
                      <EyeOff className="h-4 w-4" /> : 
                      <Eye className="h-4 w-4" />
                    }
                  </button>
                  <button 
                    type="button"
                    onClick={() => toggleEditMode('password')}
                    className="text-white/30 hover:text-blue-400 transition-colors ml-1"
                    aria-label="Éditer le mot de passe"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password}</p>
              )}
              <p className="text-xs text-white/40 mt-1">
                Pour plus de sécurité, utilisez au moins 8 caractères avec des lettres majuscules, minuscules et des chiffres.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-end">
        {hasChanges && (
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || !hasChanges}
            className="relative py-2.5 bg-gradient-to-r from-blue-600 to-gray-700 hover:from-blue-700 hover:to-gray-800 border-0"
          >
            {isSubmitting ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-5 w-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Enregistrer les modifications
              </>
            )}
          </Button>
        )}
      </div>
      
      {/* Logout and Delete Account buttons */}
      <div className="mt-8 flex flex-col md:flex-row justify-center gap-4">
        <Button 
          onClick={handleLogout}
          variant="outline"
          className="border-rose-500/40 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </Button>
        
        {onDeleteAccount && (
          <Button 
            onClick={onDeleteAccount}
            variant="outline"
            className="border-red-600/40 text-red-500 hover:bg-red-600/10 hover:text-red-400"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer mon compte
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProfileSettings; 