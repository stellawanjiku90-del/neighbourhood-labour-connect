import { useState, useEffect } from "react";
import { User, Upload, Loader2, AlertCircle, CreditCard, Check, X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { base44 } from "@/api/base44Client";

export default function ProfileSetupStep({ onSave, loading, error }) {
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [age, setAge] = useState("");
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);
  const [idPhoto, setIdPhoto] = useState(null);
  const [idPhotoUrl, setIdPhotoUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [locationName, setLocationName] = useState("");
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [detectingLocation, setDetectingLocation] = useState(true);

  useEffect(() => {
    let active = true;
    const fallback = () => {
      fetch("https://ipapi.co/json/")
        .then((r) => r.json())
        .then((d) => {
          if (!active) return;
          if (d.latitude && d.longitude) {
            setLat(d.latitude);
            setLng(d.longitude);
            setLocationName([d.city, d.country_name].filter(Boolean).join(", "));
          }
        })
        .catch(() => {})
        .finally(() => {
          if (active) setDetectingLocation(false);
        });
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (!active) return;
          const { latitude, longitude } = pos.coords;
          setLat(latitude);
          setLng(longitude);
          try {
            const r = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const d = await r.json();
            const parts = [d.city || d.locality || d.principalSubdivision, d.countryName].filter(Boolean);
            setLocationName(parts.join(", "));
          } catch {
            setLocationName(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
          if (active) setDetectingLocation(false);
        },
        () => fallback(),
        { timeout: 8000 }
      );
    } else {
      fallback();
    }
    return () => {
      active = false;
    };
  }, []);

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhoto(file);
      setProfilePhotoUrl(URL.createObjectURL(file));
    }
  };

  const handleIdPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdPhoto(file);
      setIdPhotoUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setLocalError(null);
    if (!firstName || !surname || !age || !idType || !idNumber) {
      setLocalError("Please fill in all fields.");
      return;
    }
    if (!profilePhoto || !idPhoto) {
      setLocalError("Please upload both your profile photo and ID photo.");
      return;
    }

    setUploading(true);
    try {
      const profileUpload = await base44.integrations.Core.UploadFile({ file: profilePhoto });
      const idUpload = await base44.integrations.Core.UploadFile({ file: idPhoto });
      setUploading(false);
      onSave({
        first_name: firstName,
        surname: surname,
        age: parseInt(age, 10),
        id_type: idType,
        id_number: idNumber,
        profile_photo_url: profileUpload.file_url,
        id_photo_url: idUpload.file_url,
        location_name: locationName,
        lat,
        lng,
      });
    } catch (e) {
      setUploading(false);
      setLocalError("Failed to upload photos. Please try again.");
    }
  };

  const displayError = error || localError;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-5">
        <User className="w-7 h-7 text-secondary-foreground" />
      </div>
      <h1 className="text-2xl font-extrabold text-foreground mb-2">Set Up Your Profile</h1>
      <p className="text-muted-foreground text-sm mb-4">
        Complete your profile to start using Neighbourhood Labour Connect.
      </p>

      <div className="flex items-center gap-2 bg-accent/60 rounded-xl px-3 py-2.5 mb-6">
        <MapPin className="w-4 h-4 text-accent-foreground shrink-0" />
        {detectingLocation ? (
          <span className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Detecting your location…
          </span>
        ) : (
          <span className="text-sm font-medium text-accent-foreground">
            {locationName || "Location unavailable"}
          </span>
        )}
      </div>

      {/* Profile Photo */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative">
          {profilePhotoUrl ? (
            <img
              src={profilePhotoUrl}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-secondary"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-4 border-secondary">
              <User className="w-10 h-10 text-muted-foreground" />
            </div>
          )}
          <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#2D7A3E] flex items-center justify-center cursor-pointer shadow-md">
            <Upload className="w-4 h-4 text-white" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProfilePhotoChange}
              disabled={loading || uploading}
            />
          </label>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Profile Photo</p>
      </div>

      {/* Name Fields */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <Label className="mb-1.5 block">First Name</Label>
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="h-11 rounded-xl"
            disabled={loading || uploading}
          />
        </div>
        <div>
          <Label className="mb-1.5 block">Surname</Label>
          <Input
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            className="h-11 rounded-xl"
            disabled={loading || uploading}
          />
        </div>
      </div>

      {/* Age */}
      <div className="mb-4">
        <Label className="mb-1.5 block">Age</Label>
        <Input
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="h-11 rounded-xl"
          disabled={loading || uploading}
        />
      </div>

      {/* ID Type */}
      <div className="mb-4">
        <Label className="mb-1.5 block">ID Type</Label>
        <Select value={idType} onValueChange={setIdType} disabled={loading || uploading}>
          <SelectTrigger className="h-11 rounded-xl">
            <SelectValue placeholder="Select ID type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="National ID">National ID</SelectItem>
            <SelectItem value="Passport">Passport</SelectItem>
            <SelectItem value="Driver's License">Driver's License</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ID Number */}
      <div className="mb-4">
        <Label className="mb-1.5 block">ID Number</Label>
        <Input
          value={idNumber}
          onChange={(e) => setIdNumber(e.target.value)}
          className="h-11 rounded-xl"
          disabled={loading || uploading}
        />
      </div>

      {/* ID Photo */}
      <div className="mb-4">
        <Label className="mb-1.5 block">ID Document Photo</Label>
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center">
          {idPhotoUrl ? (
            <div className="relative inline-block">
              <img src={idPhotoUrl} alt="ID" className="max-h-40 mx-auto rounded-xl" />
              <button
                onClick={() => {
                  setIdPhoto(null);
                  setIdPhotoUrl(null);
                }}
                className="absolute top-1 right-1 w-7 h-7 rounded-full bg-destructive text-white flex items-center justify-center text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center cursor-pointer py-4">
              <CreditCard className="w-10 h-10 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Tap to upload your ID photo</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleIdPhotoChange}
                disabled={loading || uploading}
              />
            </label>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          We'll verify that the names on your ID match the names you provided.
        </p>
      </div>

      {displayError && (
        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 rounded-xl px-3 py-2 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{displayError}</span>
        </div>
      )}

      <Button
        onClick={handleSave}
        disabled={loading || uploading}
        className="w-full h-12 rounded-xl bg-[#2D7A3E] hover:bg-[#246332]"
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading…
          </>
        ) : loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying & Saving…
          </>
        ) : (
          <>
            <Check className="w-4 h-4 mr-2" /> Verify & Save
          </>
        )}
      </Button>
    </div>
  );
}