import React, { useState, useEffect } from 'react'
import { User, MapPin, Edit3, Save, X, Camera, Mail, Calendar, Shield, Upload, Loader2, Check, AlertTriangle } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'

interface UserProfileData {
  id: string
  email: string
  full_name: string | null
  role: 'interviewer' | 'candidate' | 'pending'
  bio: string | null
  location: string | null
  profile_picture_url: string | null
  website: string | null
  linkedin_url: string | null
  github_url: string | null
  skills: string[]
  years_experience: number | null
  created_at: string
  updated_at: string
}

interface UserProfileProps {
  userId?: string
  isOwnProfile?: boolean
  onClose?: () => void
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  userId, 
  isOwnProfile = false, 
  onClose 
}) => {
  const { user, userRole, trackEvent } = useAuth()
  const [profile, setProfile] = useState<UserProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state for editing
  const [editForm, setEditForm] = useState({
    full_name: '',
    bio: '',
    location: '',
    website: '',
    linkedin_url: '',
    github_url: '',
    skills: [] as string[],
    years_experience: null as number | null
  })

  const targetUserId = userId || user?.id

  useEffect(() => {
    if (targetUserId) {
      fetchProfile()
    }
  }, [targetUserId])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        setError('Failed to load profile')
        return
      }

      setProfile(data)
      
      // Initialize edit form with current data
      setEditForm({
        full_name: data.full_name || '',
        bio: data.bio || '',
        location: data.location || '',
        website: data.website || '',
        linkedin_url: data.linkedin_url || '',
        github_url: data.github_url || '',
        skills: data.skills || [],
        years_experience: data.years_experience
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB')
      return
    }

    setUploadingImage(true)
    try {
      // Create unique filename with user ID folder structure
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${user.id}-${Date.now()}.${fileExt}`

      console.log('Uploading file to path:', fileName)

      // Upload to Supabase Storage with proper path structure
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true // Allow overwriting existing files
        })

      if (uploadError) {
        console.error('Error uploading image:', uploadError)
        alert(`Failed to upload image: ${uploadError.message}`)
        return
      }

      console.log('Upload successful:', uploadData)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName)

      console.log('Public URL:', publicUrl)

      // Update profile with new image URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          profile_picture_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating profile:', updateError)
        alert('Failed to update profile picture')
        return
      }

      // Update local state
      setProfile(prev => prev ? { ...prev, profile_picture_url: publicUrl } : null)
      
      await trackEvent('profile_picture_updated')
      
      console.log('Profile picture updated successfully')
      
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const addSkill = (skill: string) => {
    if (skill.trim() && !editForm.skills.includes(skill.trim())) {
      setEditForm(prev => ({
        ...prev,
        skills: [...prev.skills, skill.trim()]
      }))
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setEditForm(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }))
  }

  // Helper function to ensure URLs have proper protocol
  const normalizeUrl = (url: string, expectedDomain?: string): string | null => {
    if (!url || url.trim() === '') return null
    
    let normalizedUrl = url.trim()
    
    // Add https:// if no protocol is present
    if (!normalizedUrl.match(/^https?:\/\//)) {
      normalizedUrl = `https://${normalizedUrl}`
    }
    
    // For LinkedIn URLs, ensure they match the expected pattern
    if (expectedDomain === 'linkedin' && normalizedUrl) {
      // Remove any existing protocol and normalize
      const cleanUrl = normalizedUrl.replace(/^https?:\/\//, '')
      
      // If it's just the base domain without a profile path, return null
      if (cleanUrl === 'linkedin.com' || cleanUrl === 'www.linkedin.com' || cleanUrl === 'linkedin.com/' || cleanUrl === 'www.linkedin.com/') {
        return null
      }
      
      // Ensure it starts with linkedin.com or www.linkedin.com
      if (!cleanUrl.match(/^(www\.)?linkedin\.com\//)) {
        // If it's just a username or partial path, construct the full URL
        const username = cleanUrl.replace(/^(www\.)?linkedin\.com\/?(in\/)?/, '')
        if (username) {
          normalizedUrl = `https://www.linkedin.com/in/${username}`
        } else {
          return null
        }
      } else {
        normalizedUrl = `https://${cleanUrl}`
      }
    }
    
    // For GitHub URLs, ensure they match the expected pattern
    if (expectedDomain === 'github' && normalizedUrl) {
      const cleanUrl = normalizedUrl.replace(/^https?:\/\//, '')
      
      // If it's just the base domain without a profile path, return null
      if (cleanUrl === 'github.com' || cleanUrl === 'www.github.com' || cleanUrl === 'github.com/' || cleanUrl === 'www.github.com/') {
        return null
      }
      
      if (!cleanUrl.match(/^(www\.)?github\.com\//)) {
        // If it's just a username, construct the full URL
        const username = cleanUrl.replace(/^(www\.)?github\.com\/?/, '')
        if (username) {
          normalizedUrl = `https://github.com/${username}`
        } else {
          return null
        }
      } else {
        normalizedUrl = `https://${cleanUrl}`
      }
    }
    
    return normalizedUrl
  }

  const saveProfile = async () => {
    if (!user || !profile) return

    setSaving(true)
    try {
      // Normalize URLs before saving
      const updateData = {
        ...editForm,
        website: normalizeUrl(editForm.website),
        linkedin_url: normalizeUrl(editForm.linkedin_url, 'linkedin'),
        github_url: normalizeUrl(editForm.github_url, 'github'),
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)

      if (error) {
        console.error('Error updating profile:', error)
        alert('Failed to update profile')
        return
      }

      // Update local state
      setProfile(prev => prev ? { ...prev, ...updateData } : null)
      setEditing(false)
      
      await trackEvent('profile_updated', { 
        fields_updated: Object.keys(editForm).filter(key => editForm[key as keyof typeof editForm] !== profile[key as keyof UserProfileData])
      })

    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = () => {
    setEditing(false)
    // Reset form to current profile data
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        linkedin_url: profile.linkedin_url || '',
        github_url: profile.github_url || '',
        skills: profile.skills || [],
        years_experience: profile.years_experience
      })
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'interviewer': return 'bg-purple-500/20 text-purple-400'
      case 'candidate': return 'bg-blue-500/20 text-blue-400'
      case 'pending': return 'bg-yellow-500/20 text-yellow-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
          <p className="text-white">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Profile Not Found</h3>
          <p className="text-gray-300">{error || 'Unable to load profile'}</p>
          {onClose && (
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    )
  }

  const canEdit = isOwnProfile || user?.id === profile.id

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-teal-500/20 to-cyan-500/20 p-6">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        
        <div className="flex items-start space-x-6">
          {/* Profile Picture */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-white/10 border-2 border-white/20">
              {profile.profile_picture_url ? (
                <img
                  src={profile.profile_picture_url}
                  alt={profile.full_name || 'Profile'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>
            
            {canEdit && (
              <div className="absolute bottom-0 right-0">
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                  <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-teal-600 transition-colors">
                    {uploadingImage ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 text-white" />
                    )}
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold text-white">
                {profile.full_name || 'No name provided'}
              </h1>
              {canEdit && (
                <button
                  onClick={() => editing ? cancelEdit() : setEditing(true)}
                  className="flex items-center space-x-2 px-3 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors"
                >
                  {editing ? (
                    <>
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-4 h-4" />
                      <span>Edit Profile</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="flex items-center space-x-4 mb-3">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">{profile.email}</span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(profile.role)}`}>
                {profile.role}
              </span>
            </div>

            {profile.location && (
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">{profile.location}</span>
              </div>
            )}

            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="p-6 space-y-6">
        {editing ? (
          /* Edit Mode */
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="City, Country"
                  />
                </div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Bio
              </label>
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Tell us about yourself, your experience, and what you're passionate about..."
              />
            </div>

            {/* Professional Information */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Professional Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    value={editForm.years_experience || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, years_experience: e.target.value ? parseInt(e.target.value) : null }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="0"
                    min="0"
                    max="50"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={editForm.website}
                    onChange={(e) => setEditForm(prev => ({ ...prev, website: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Social Links</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    value={editForm.linkedin_url}
                    onChange={(e) => setEditForm(prev => ({ ...prev, linkedin_url: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="https://linkedin.com/in/yourprofile or just your username"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    You can enter just your username or the full URL
                  </p>
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    value={editForm.github_url}
                    onChange={(e) => setEditForm(prev => ({ ...prev, github_url: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="https://github.com/yourusername or just your username"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    You can enter just your username or the full URL
                  </p>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Skills
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {editForm.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-teal-500/20 text-teal-400 rounded-full text-sm flex items-center space-x-2"
                  >
                    <span>{skill}</span>
                    <button
                      onClick={() => removeSkill(skill)}
                      className="text-teal-300 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Add a skill and press Enter"
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addSkill(e.currentTarget.value)
                      e.currentTarget.value = ''
                    }
                  }}
                />
              </div>
            </div>

            {/* Save/Cancel Buttons */}
            <div className="flex space-x-4 pt-4">
              <button
                onClick={cancelEdit}
                className="flex-1 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveProfile}
                disabled={saving}
                className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Profile</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* View Mode */
          <div className="space-y-6">
            {/* Bio */}
            {profile.bio && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">About</h3>
                <p className="text-gray-300 leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Professional Info */}
            {(profile.years_experience || profile.website || profile.linkedin_url || profile.github_url) && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Professional Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {profile.years_experience && (
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="text-gray-400 text-sm">Experience</div>
                      <div className="text-white font-medium">
                        {profile.years_experience} {profile.years_experience === 1 ? 'year' : 'years'}
                      </div>
                    </div>
                  )}
                  {profile.website && (
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="text-gray-400 text-sm">Website</div>
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-400 hover:text-teal-300 transition-colors break-all"
                      >
                        {profile.website}
                      </a>
                    </div>
                  )}
                  {profile.linkedin_url && (
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="text-gray-400 text-sm">LinkedIn</div>
                      <a
                        href={profile.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-400 hover:text-teal-300 transition-colors break-all"
                      >
                        View Profile
                      </a>
                    </div>
                  )}
                  {profile.github_url && (
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="text-gray-400 text-sm">GitHub</div>
                      <a
                        href={profile.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-400 hover:text-teal-300 transition-colors break-all"
                      >
                        View Profile
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-teal-500/20 text-teal-400 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!profile.bio && !profile.years_experience && !profile.website && !profile.linkedin_url && !profile.github_url && (!profile.skills || profile.skills.length === 0) && canEdit && (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Complete Your Profile</h3>
                <p className="text-gray-300 mb-4">
                  Add your bio, skills, and professional information to showcase yourself to the community.
                </p>
                <button
                  onClick={() => setEditing(true)}
                  className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all duration-200"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}