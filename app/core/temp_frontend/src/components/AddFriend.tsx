import { useState } from 'react';
import { friendshipService } from '@/services/friendship.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { UserPlus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export function AddFriend() {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Récupérer l'ID de l'utilisateur connecté depuis le localStorage
  const currentUserId = Number(localStorage.getItem('userId'));

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    try {
      setIsLoading(true);
      // Ici, vous devrez d'abord récupérer l'ID de l'utilisateur à partir du nom d'utilisateur
      // Pour l'exemple, nous supposons que nous avons déjà l'ID
      const friendId = 123; // À remplacer par la vraie logique de recherche d'utilisateur
      await friendshipService.sendFriendRequest(currentUserId, friendId);
      
      toast({
        title: "Succès",
        description: "Demande d'ami envoyée"
      });
      
      setUsername('');
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la demande d'ami",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Ajouter un ami
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddFriend} className="flex gap-2">
          <Input
            placeholder="Nom d'utilisateur"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Envoi..." : "Ajouter"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 