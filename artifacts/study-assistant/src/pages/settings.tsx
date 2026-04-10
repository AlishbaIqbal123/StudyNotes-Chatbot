import { useAuth } from "@/lib/auth";
import { useTheme } from "@/components/theme-provider";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Moon, Sun, Monitor, LogOut, User as UserIcon, Bell, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";

export function Settings() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-8 md:py-12 space-y-10">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
        <p className="text-lg text-muted-foreground mt-2">Manage your app preferences and account settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1 space-y-2">
          {/* Simple Settings Nav */}
          <Button variant="secondary" className="w-full justify-start font-semibold">
            <Monitor className="mr-3 h-4 w-4" /> Appearance
          </Button>
          <Button variant="ghost" className="w-full justify-start font-medium text-muted-foreground">
            <UserIcon className="mr-3 h-4 w-4" /> Account
          </Button>
          <Button variant="ghost" className="w-full justify-start font-medium text-muted-foreground">
            <Bell className="mr-3 h-4 w-4" /> Notifications
          </Button>
          <Button variant="ghost" className="w-full justify-start font-medium text-muted-foreground">
            <Shield className="mr-3 h-4 w-4" /> Privacy
          </Button>
        </div>

        <div className="md:col-span-3 space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-none shadow-lg">
              <CardHeader className="pb-4 border-b border-border/50">
                <CardTitle className="text-2xl">Appearance</CardTitle>
                <CardDescription className="text-base">Customize how Aura Study looks on your device.</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <RadioGroup 
                  value={theme} 
                  onValueChange={(val) => setTheme(val as any)}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-6"
                >
                  <div>
                    <RadioGroupItem value="light" id="light" className="peer sr-only" />
                    <Label
                      htmlFor="light"
                      className="flex flex-col items-center justify-between rounded-2xl border-2 border-muted bg-popover p-6 hover:bg-accent/5 hover:border-primary/30 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                    >
                      <Sun className="mb-4 h-8 w-8 text-orange-500" />
                      <span className="font-bold text-lg">Light</span>
                      <span className="text-sm text-muted-foreground mt-1">Sunlit workspace</span>
                    </Label>
                  </div>
                  
                  <div>
                    <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                    <Label
                      htmlFor="dark"
                      className="flex flex-col items-center justify-between rounded-2xl border-2 border-muted bg-popover p-6 hover:bg-accent/5 hover:border-primary/30 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                    >
                      <Moon className="mb-4 h-8 w-8 text-indigo-400" />
                      <span className="font-bold text-lg">Dark</span>
                      <span className="text-sm text-muted-foreground mt-1">Midnight studio</span>
                    </Label>
                  </div>
                  
                  <div>
                    <RadioGroupItem value="system" id="system" className="peer sr-only" />
                    <Label
                      htmlFor="system"
                      className="flex flex-col items-center justify-between rounded-2xl border-2 border-muted bg-popover p-6 hover:bg-accent/5 hover:border-primary/30 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                    >
                      <Monitor className="mb-4 h-8 w-8 text-muted-foreground" />
                      <span className="font-bold text-lg">System</span>
                      <span className="text-sm text-muted-foreground mt-1">Matches device</span>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-none shadow-lg">
              <CardHeader className="pb-4 border-b border-border/50">
                <CardTitle className="text-2xl">Preferences</CardTitle>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-border/50">
                <div className="flex items-center justify-between p-6">
                  <div>
                    <p className="font-semibold text-lg">Auto-generate Audio</p>
                    <p className="text-sm text-muted-foreground">Create audio summaries for text uploads</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-6">
                  <div>
                    <p className="font-semibold text-lg">Study Reminders</p>
                    <p className="text-sm text-muted-foreground">Receive email notifications for spaced repetition</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-none shadow-lg border-red-500/20">
              <CardHeader className="pb-4 border-b border-border/50">
                <CardTitle className="text-2xl text-destructive">Account Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-lg">Sign Out</p>
                    <p className="text-sm text-muted-foreground font-medium">Currently signed in as {user.email}</p>
                  </div>
                  <Button variant="outline" className="w-full sm:w-auto hover:bg-destructive hover:text-destructive-foreground transition-colors" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
