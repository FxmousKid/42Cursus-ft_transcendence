import { useState, useEffect } from 'react';
import { Edit, LogOut, Lock, User as UserIcon, Mail, Eye, EyeOff, Shield, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { UserProfileData } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

interface ProfileSettingsProps {
  profile: UserProfileData;
  onSaveProfile: (data: { username?: string; email?: string; password?: string }) => Promise<void>;
  onLogout: () => void;
}

const ProfileSettings = ({ profile, onSaveProfile, onLogout }: ProfileSettingsProps) => {
  const { logout } = useAuth();
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
  };
  
  const toggleEditMode = (field: 'username' | 'email' | 'password') => {
    setEditMode(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };
  
  const handleSubmit = async () => {
    if (!hasChanges) return;
    
    setIsSubmitting(true);
    try {
      const updatedData = {
        username: formData.username !== profile.username ? formData.username : undefined,
        email: formData.email !== profile.email ? formData.email : undefined,
        password: formData.password ? formData.password : undefined,
      };
      
      await onSaveProfile(updatedData);
      
      // Reset password field after submission
      setFormData(prev => ({ ...prev, password: '' }));
      
      // Reset edit modes
      setEditMode({
        username: false,
        email: false,
        password: false
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
                  className={`bg-black/30 border-white/10 focus-visible:ring-blue-500 focus-visible:border-blue-500 pl-10 ${editMode.username ? '' : 'opacity-80'}`}
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
                  className={`bg-black/30 border-white/10 focus-visible:ring-blue-500 focus-visible:border-blue-500 pl-10 ${editMode.email ? '' : 'opacity-80'}`}
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
                  className={`bg-black/30 border-white/10 focus-visible:ring-blue-500 focus-visible:border-blue-500 pl-10 pr-10 ${editMode.password ? '' : 'opacity-80'}`}
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
      
      {/* Logout button at the bottom */}
      <div className="mt-8 flex justify-center">
        <Button 
          onClick={handleLogout}
          variant="outline"
          className="border-rose-500/40 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
};

export default ProfileSettings; 