import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { 
  User, 
  ArrowLeft,
  Star,
  Plus,
  Trash2,
  Check,
  Calendar,
  MapPin,
  Clock
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Profile() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [authLoading, isAuthenticated]);

  const { data: profiles, isLoading: profilesLoading } = trpc.profile.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const setPrimary = trpc.profile.setPrimary.useMutation({
    onSuccess: () => {
      utils.profile.list.invalidate();
      toast.success("Primary profile updated");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update primary profile");
    }
  });

  const deleteProfile = trpc.profile.delete.useMutation({
    onSuccess: () => {
      utils.profile.list.invalidate();
      toast.success("Profile deleted");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete profile");
    }
  });

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const isLoading = authLoading || profilesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container flex items-center gap-4 h-16">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-semibold">Profile</h1>
            <p className="text-sm text-muted-foreground">Manage your account and birth profiles</p>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* User Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{user?.name || "User"}</h3>
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>
                <Button variant="outline" onClick={handleLogout}>
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Birth Profiles */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-primary" />
                    Birth Profiles
                  </CardTitle>
                  <CardDescription>
                    Manage your birth chart profiles
                  </CardDescription>
                </div>
                <Button asChild>
                  <Link href="/onboarding">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Profile
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profiles?.map((profile) => (
                  <div 
                    key={profile.id} 
                    className={`p-4 rounded-lg border ${
                      profile.isPrimary ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{profile.profileName}</h4>
                          {profile.isPrimary && (
                            <Badge variant="default" className="text-xs">Primary</Badge>
                          )}
                        </div>
                        <div className="grid sm:grid-cols-3 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {profile.birthDate}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {profile.birthTime}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {profile.birthPlace}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {!profile.isPrimary && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setPrimary.mutate({ profileId: profile.id })}
                            disabled={setPrimary.isPending}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Set Primary
                          </Button>
                        )}
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Profile?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{profile.profileName}" and all associated data. 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteProfile.mutate({ profileId: profile.id })}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <Button variant="link" className="p-0 h-auto" asChild>
                        <Link href={`/chart/${profile.id}`}>
                          View Chart →
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
                
                {(!profiles || profiles.length === 0) && (
                  <div className="text-center py-8">
                    <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No Profiles Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first birth profile to get started.
                    </p>
                    <Button asChild>
                      <Link href="/onboarding">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Profile
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <h4 className="font-medium">Default Ayanamsa</h4>
                  <p className="text-sm text-muted-foreground">
                    Lahiri (Chitrapaksha) - Most commonly used
                  </p>
                </div>
                <Badge variant="secondary">Lahiri</Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <h4 className="font-medium">Chart Style</h4>
                  <p className="text-sm text-muted-foreground">
                    South Indian format with fixed signs
                  </p>
                </div>
                <Badge variant="secondary">South Indian</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
