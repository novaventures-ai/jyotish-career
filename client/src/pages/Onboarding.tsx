import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useGuestChart } from "@/contexts/GuestChartContext";
import { Star, MapPin, Calendar, Clock, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import PlaceAutocomplete from "@/components/PlaceAutocomplete";

interface BirthData {
  profileName: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  latitude: number;
  longitude: number;
  timezone: string;
  timezoneOffset: number;
  ayanamsa: "lahiri" | "raman" | "krishnamurti";
}


export default function Onboarding() {
  const { isAuthenticated } = useAuth();
  const { setGuestChart } = useGuestChart();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [birthData, setBirthData] = useState<BirthData>({
    profileName: "My Profile",
    birthDate: "",
    birthTime: "",
    birthPlace: "",
    latitude: 0,
    longitude: 0,
    timezone: "",
    timezoneOffset: 0,
    ayanamsa: "lahiri"
  });
  const [customLocation, setCustomLocation] = useState(false);

  // For authenticated users - save to database
  const createProfile = trpc.profile.create.useMutation({
    onSuccess: () => {
      toast.success("Birth chart created and saved!");
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create profile");
    }
  });

  // For guest users - generate chart without saving
  const generateGuestChart = trpc.chart.generateGuest.useMutation({
    onSuccess: (data) => {
      console.log('[DEBUG] generateGuestChart success. D9 Asc:', data.d9?.ascendant);
      console.log('[DEBUG] generateGuestChart success. D10 Asc:', data.d10?.ascendant);
      // Store in guest context
      setGuestChart({
        birthData: {
          birthDate: birthData.birthDate,
          birthTime: birthData.birthTime,
          birthPlace: birthData.birthPlace,
          latitude: birthData.latitude,
          longitude: birthData.longitude,
          timezone: birthData.timezone,
          timezoneOffset: birthData.timezoneOffset,
          profileName: birthData.profileName,
          ayanamsa: birthData.ayanamsa,
        },
        chartData: data,
        createdAt: Date.now(),
      });
      toast.success("Birth chart generated!");
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate chart");
      setIsGenerating(false);
    }
  });

  // Handle place selection from Google Maps Autocomplete
  const utils = trpc.useUtils();

  const handlePlaceSelect = async (place: {
    name: string;
    latitude: number;
    longitude: number;
    formattedAddress: string;
  }) => {
    try {
      // Get accurate timezone from server
      const geoData = await utils.geo.getLocation.fetch({ location: place.formattedAddress });

      setBirthData(prev => ({
        ...prev,
        birthPlace: geoData.placeName,
        latitude: geoData.latitude,
        longitude: geoData.longitude,
        timezone: geoData.timezone || "UTC",
        timezoneOffset: geoData.timezoneOffset
      }));
    } catch (err) {
      console.error("Failed to fetch timezone:", err);
      // Fallback to estimation if server fails

      let estimatedOffset = Math.round(place.longitude / 15);
      let estimatedTimezone = `UTC${estimatedOffset >= 0 ? '+' : ''}${estimatedOffset}`;

      // Heuristic for India
      if (place.formattedAddress.includes("India")) {
        estimatedOffset = 5.5;
        estimatedTimezone = "Asia/Kolkata";
      }

      setBirthData(prev => ({
        ...prev,
        birthPlace: place.formattedAddress,
        latitude: place.latitude,
        longitude: place.longitude,
        timezone: estimatedTimezone,
        timezoneOffset: estimatedOffset
      }));

      // Silent fallback, manual entry opens for verification anyway
      setCustomLocation(true); // Open the manual form so user can check/fix
      return; // Return early to avoid closing the custom location form
    }

    setCustomLocation(false);
  };

  const handleSubmit = () => {
    setIsGenerating(true);

    if (isAuthenticated) {
      // Authenticated user - save to database
      createProfile.mutate({
        ...birthData,
        isPrimary: true
      });
    } else {
      // Guest user - generate chart without saving
      generateGuestChart.mutate({
        birthDate: birthData.birthDate,
        birthTime: birthData.birthTime,
        birthPlace: birthData.birthPlace || "Unknown",
        latitude: birthData.latitude,
        longitude: birthData.longitude,
        timezoneOffset: birthData.timezoneOffset,
        ayanamsa: birthData.ayanamsa,
      });
    }
  };

  const canProceedStep1 = birthData.birthDate !== "";
  const canProceedStep2 = birthData.birthTime !== "";
  const canProceedStep3 = birthData.birthPlace !== "" && birthData.latitude !== 0;
  const isPending = createProfile.isPending || generateGuestChart.isPending || isGenerating;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full cosmic-gradient flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">Jyotish Career</span>
          </Link>
        </div>
      </nav>

      <div className="container pt-24 pb-12">
        <div className="max-w-2xl mx-auto">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full transition-colors ${s === step ? "bg-primary" : s < step ? "bg-primary/50" : "bg-muted"
                  }`}
              />
            ))}
          </div>

          {/* Step 1: Birth Date */}
          {step === 1 && (
            <Card className="border-border/50">
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full cosmic-gradient flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl">When were you born?</CardTitle>
                <CardDescription>
                  Your birth date is the foundation of your Vedic chart
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Birth Date</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={birthData.birthDate}
                    onChange={(e) => setBirthData(prev => ({ ...prev, birthDate: e.target.value }))}
                    className="text-lg h-12"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!canProceedStep1}
                    size="lg"
                  >
                    Continue
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Birth Time */}
          {step === 2 && (
            <Card className="border-border/50">
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full cosmic-gradient flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl">What time were you born?</CardTitle>
                <CardDescription>
                  Accurate birth time is crucial for precise Ascendant calculation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="birthTime">Birth Time</Label>
                  <Input
                    id="birthTime"
                    type="time"
                    value={birthData.birthTime}
                    onChange={(e) => setBirthData(prev => ({ ...prev, birthTime: e.target.value }))}
                    className="text-lg h-12"
                  />
                  <p className="text-sm text-muted-foreground">
                    If you don't know your exact birth time, check your birth certificate or ask family members.
                  </p>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)} size="lg">
                    <ChevronLeft className="w-5 h-5 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!canProceedStep2}
                    size="lg"
                  >
                    Continue
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Birth Place */}
          {step === 3 && (
            <Card className="border-border/50">
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full cosmic-gradient flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Where were you born?</CardTitle>
                <CardDescription>
                  Birth location determines your house positions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Birth Location</Label>
                  <PlaceAutocomplete
                    value={birthData.birthPlace}
                    onPlaceSelect={handlePlaceSelect}
                    placeholder="Search for your birth city"
                    className="h-12 text-lg"
                  />
                  <p className="text-sm text-muted-foreground">
                    Start typing to search for any city worldwide
                  </p>
                </div>

                <div className="text-center">
                  <Button
                    variant="link"
                    onClick={() => setCustomLocation(!customLocation)}
                    className="text-sm"
                  >
                    {customLocation ? "Use location search" : "Enter custom coordinates"}
                  </Button>
                </div>

                {customLocation && (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="customPlace">Place Name</Label>
                      <Input
                        id="customPlace"
                        value={birthData.birthPlace}
                        onChange={(e) => setBirthData(prev => ({ ...prev, birthPlace: e.target.value }))}
                        placeholder="City, Country"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="latitude">Latitude</Label>
                        <Input
                          id="latitude"
                          type="number"
                          step="0.0001"
                          value={birthData.latitude || ""}
                          onChange={(e) => setBirthData(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                          placeholder="28.6139"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="longitude">Longitude</Label>
                        <Input
                          id="longitude"
                          type="number"
                          step="0.0001"
                          value={birthData.longitude || ""}
                          onChange={(e) => setBirthData(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                          placeholder="77.2090"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Input
                          id="timezone"
                          value={birthData.timezone}
                          onChange={(e) => setBirthData(prev => ({ ...prev, timezone: e.target.value }))}
                          placeholder="Asia/Kolkata"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="offset">UTC Offset (hours)</Label>
                        <Input
                          id="offset"
                          type="number"
                          step="0.5"
                          value={birthData.timezoneOffset || ""}
                          onChange={(e) => setBirthData(prev => ({ ...prev, timezoneOffset: parseFloat(e.target.value) || 0 }))}
                          placeholder="5.5"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)} size="lg">
                    <ChevronLeft className="w-5 h-5 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(4)}
                    disabled={!canProceedStep3}
                    size="lg"
                  >
                    Continue
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Confirmation & Settings */}
          {step === 4 && (
            <Card className="border-border/50">
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full cosmic-gradient flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Ready to Generate Your Chart</CardTitle>
                <CardDescription>
                  Review your details and customize settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary */}
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Birth Date</span>
                    <span className="font-medium">{birthData.birthDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Birth Time</span>
                    <span className="font-medium">{birthData.birthTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Birth Place</span>
                    <span className="font-medium">{birthData.birthPlace}</span>
                  </div>
                </div>

                {/* Settings */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="profileName">Profile Name</Label>
                    <Input
                      id="profileName"
                      value={birthData.profileName}
                      onChange={(e) => setBirthData(prev => ({ ...prev, profileName: e.target.value }))}
                      placeholder="My Profile"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Ayanamsa System</Label>
                    <Select
                      value={birthData.ayanamsa}
                      onValueChange={(v) => setBirthData(prev => ({ ...prev, ayanamsa: v as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lahiri">Lahiri (Chitrapaksha)</SelectItem>
                        <SelectItem value="raman">Raman</SelectItem>
                        <SelectItem value="krishnamurti">Krishnamurti (KP)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Lahiri is the most commonly used ayanamsa in Vedic astrology.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(3)} size="lg">
                    <ChevronLeft className="w-5 h-5 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isPending}
                    size="lg"
                    className="min-w-[180px]"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        Generate Chart
                        <ChevronRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>

                {!isAuthenticated && (
                  <p className="text-sm text-center text-muted-foreground">
                    Your chart will be generated instantly. Sign in later to save your profile permanently.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
