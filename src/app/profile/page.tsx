'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';

// Assume a type for CandidateProfile data (you might need to define this based on your backend)
interface CandidateProfileData {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  bio?: string;
  skills: string[];
  profilePictureUrl?: string;
  resumeUrl?: string; // Or resume text
  // Add other fields as needed (work experience, education, etc.)
}

export default function ProfilePage() {
  const [profileData, setProfileData] = useState<CandidateProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const { toast } = useToast();

  // **TODO: Fetch candidate profile data on component mount**
  useEffect(() => {
      async function fetchProfile() {
          // Replace with your actual API call to fetch candidate profile
          console.log('Fetching profile...');
          // Simulate fetching data
          const fetchedData: CandidateProfileData = {
              name: 'John Doe',
              email: 'john.doe@example.com',
              phone: '123-456-7890',
              location: 'San Francisco, CA',
              bio: 'Experienced software engineer with a focus on web development.',
              skills: ['React', 'Node.js', 'TypeScript', 'SQL'],
              profilePictureUrl: '', // Add a placeholder or fetched URL
              resumeUrl: '', // Add a placeholder or fetched URL
          };
          setProfileData(fetchedData);
          setIsLoading(false);
      }
      fetchProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { id, value } = e.target;
      setProfileData(prevData => prevData ? { ...prevData, [id]: value } : null);
  };

  const handleAddSkill = () => {
      if (newSkill && profileData && !profileData.skills.includes(newSkill)) {
          setProfileData(prevData => prevData ? { ...prevData, skills: [...prevData.skills, newSkill] } : null);
          setNewSkill('');
      }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
      setProfileData(prevData => prevData ? { ...prevData, skills: prevData.skills.filter(skill => skill !== skillToRemove) } : null);
  };

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // **TODO: Implement backend logic for resume upload**
      console.log('Uploading resume:', file.name);
      toast({
          title: 'Resume Upload',
          description: 'Resume upload functionality is not yet fully implemented.',
      });
      // You would typically upload the file to a storage service (e.g., Firebase Storage)
      // and save the URL or relevant data to the user's profile in your database.
    }
  };

  const handleSaveProfile = async () => {
      if (!profileData) return;

      setIsSaving(true);
      // **TODO: Implement backend logic to save profile data**
      console.log('Saving profile:', profileData);
       toast({
          title: 'Save Profile',
          description: 'Profile saving functionality is not yet fully implemented.',
      });
      // Call your backend API to update the candidate's profile in the database.
      setIsSaving(false);
  };

  if (isLoading) {
    return (
        <div>
            <h1 className="text-3xl font-headline font-bold mb-6 text-foreground">Candidate Profile</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Loading Profile</CardTitle>
                    <CardDescription>Fetching candidate profile data...</CardDescription>
                </CardHeader>
                <CardContent>
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                </CardContent>
            </Card>
        </div>
    )
  }

  if (!profileData) {
      return (
           <div>
                <h1 className="text-3xl font-headline font-bold mb-6 text-foreground">Candidate Profile</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Not Found</CardTitle>
                        <CardDescription>Could not load the candidate profile.</CardDescription>
                    </CardHeader>
                     <CardContent>
                       <p>There was an error fetching the profile or the profile does not exist.</p>
                    </CardContent>
                </Card>
           </div>
      )
  }

  return (
    <div>
      <h1 className="text-3xl font-headline font-bold mb-6 text-foreground">Candidate Profile</h1>

      {/* Profile Information Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Manage your basic profile details.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col items-center gap-4">
                <Avatar className="w-24 h-24">
                    <AvatarImage src={profileData.profilePictureUrl || "https://github.com/shadcn.png"} alt="Profile Picture" /> {/* Use actual profile picture URL */}
                    <AvatarFallback>{profileData.name.charAt(0)}</AvatarFallback>
                </Avatar>
                 {/* TODO: Add profile picture upload functionality */}
                <Button variant="outline" size="sm">Upload Photo</Button>
            </div>
            <div className="grid gap-2">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={profileData.name} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={profileData.email} onChange={handleInputChange} disabled /> {/* Email might be disabled if managed by auth */}
              </div>
               <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" value={profileData.phone || ''} onChange={handleInputChange} />
              </div>
               <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={profileData.location || ''} onChange={handleInputChange} />
              </div>
            </div>
          </div>
           <div className="grid gap-2 mt-4">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" value={profileData.bio || ''} onChange={handleInputChange} rows={5} />
           </div>
        </CardContent>
      </Card>

      {/* Skills Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Skills</CardTitle>
          <CardDescription>Add and manage your technical skills.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Input
              placeholder="Add a skill..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => { if (e.key === 'Enter') { handleAddSkill(); } }}
            />
            <Button onClick={handleAddSkill} disabled={!newSkill}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {profileData.skills.map((skill, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {skill}
                <button onClick={() => handleRemoveSkill(skill)} className="ml-1 text-xs text-muted-foreground hover:text-foreground focus:outline-none">
                  &times;
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resume Card */}
       <Card className="mb-6">
        <CardHeader>
          <CardTitle>Resume</CardTitle>
          <CardDescription>Upload or view your resume.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="grid gap-2">
                <Label htmlFor="resumeUpload">Upload Resume</Label>
                <div className="flex items-center gap-2">
                    <Input id="resumeUpload" type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} />
                    {/* TODO: Display uploaded resume name or provide download link */}
                     {profileData.resumeUrl && <a href={profileData.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">View Resume</a>}
                </div>
           </div>
           {/* TODO: Potentially add a text area to paste resume text */}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveProfile} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Profile
        </Button>
      </div>

    </div>
  );
}
