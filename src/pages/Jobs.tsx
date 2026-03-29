import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { uploadFile } from '@/lib/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Briefcase, Search, Plus, MapPin, Clock, FileUp, X, Trash2, Calendar } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface CustomField {
  label: string;
  type: 'text' | 'textarea' | 'file';
  required: boolean;
}

const Jobs = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [postOpen, setPostOpen] = useState(false);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const { data } = await (supabase.from('jobs') as any).select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const toggleType = (type: string) => {
    setTypeFilters(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const filteredJobs = jobs.filter((j: any) => {
    const matchSearch = !search || j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.company.toLowerCase().includes(search.toLowerCase());
    const matchLocation = !locationFilter || j.location?.toLowerCase().includes(locationFilter.toLowerCase());
    const matchType = typeFilters.length === 0 || typeFilters.includes(j.job_type);
    return matchSearch && matchLocation && matchType;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Sidebar - Search Filters */}
      <aside className="lg:col-span-4">
        <Card className="sticky top-20">
          <CardContent className="p-5 space-y-5">
            <h3 className="font-bold text-lg">Search filters</h3>

            {/* Job title */}
            <div>
              <label className="text-sm font-bold block mb-1.5">Job title</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="e.g. React Developer"
                  className="pl-9"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-bold block mb-1.5">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="e.g. Lahore"
                  className="pl-9"
                  value={locationFilter}
                  onChange={e => setLocationFilter(e.target.value)}
                />
              </div>
            </div>

            {/* Job type */}
            <div>
              <label className="text-sm font-bold block mb-2">Job type</label>
              <div className="space-y-2">
                {['Full-time', 'Part-time', 'Contract', 'Internship'].map(type => (
                  <label key={type} className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-foreground">
                    <input
                      type="checkbox"
                      checked={typeFilters.includes(type)}
                      onChange={() => toggleType(type)}
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>

            {/* Experience level (UI only for now) */}
            <div>
              <label className="text-sm font-bold block mb-2">Experience level</label>
              <div className="space-y-2">
                {['Entry level', 'Mid-Senior level', 'Director', 'Executive'].map(level => (
                  <label key={level} className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-foreground">
                    <input type="checkbox" className="h-4 w-4 rounded border-border accent-primary" />
                    {level}
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </aside>

      {/* Right - Job Listings */}
      <div className="lg:col-span-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold">Recommended for you</h2>
            <p className="text-sm text-muted-foreground font-medium">Based on your profile and search history</p>
          </div>
          <Dialog open={postOpen} onOpenChange={setPostOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full gap-1.5 font-bold">
                <Plus className="h-4 w-4" /> Post a Job
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Post a Job</DialogTitle></DialogHeader>
              <PostJobForm onSuccess={() => { setPostOpen(false); queryClient.invalidateQueries({ queryKey: ['jobs'] }); }} />
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <p className="text-center py-8 text-muted-foreground">Loading jobs...</p>
        ) : filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <Briefcase className="h-14 w-14 mx-auto mb-4 text-muted-foreground/40" />
              <p className="text-xl font-bold">No jobs found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or post a job opportunity!</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0 divide-y">
              {filteredJobs.map((job: any) => <JobCard key={job.id} job={job} />)}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

const PostJobForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: '', company: '', location: '', job_type: 'Full-time', description: '', deadline: '',
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);
  const docRef = useRef<HTMLInputElement>(null);

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { label: '', type: 'text', required: false }]);
  };

  const handleSubmit = async () => {
    if (!user || !form.title || !form.company || !form.description) return;
    setPosting(true);
    try {
      let docUrl = null;
      if (docFile) {
        docUrl = await uploadFile('job-documents', user.id, docFile);
      }
      await (supabase.from('jobs') as any).insert({
        user_id: user.id,
        title: form.title,
        company: form.company,
        location: form.location,
        job_type: form.job_type,
        description: form.description,
        skills,
        deadline: form.deadline || null,
        document_url: docUrl,
        custom_fields: customFields.filter(f => f.label.trim()),
      });
      toast.success('Job posted!');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-3">
      <Input placeholder="Job Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      <Input placeholder="Company Name *" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
      <Input placeholder="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
      <Select value={form.job_type} onValueChange={v => setForm(f => ({ ...f, job_type: v }))}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="Full-time">Full-time</SelectItem>
          <SelectItem value="Part-time">Part-time</SelectItem>
          <SelectItem value="Contract">Contract</SelectItem>
          <SelectItem value="Remote">Remote</SelectItem>
        </SelectContent>
      </Select>
      <Textarea placeholder="Job Description *" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="min-h-[100px]" />
      
      {/* Skills */}
      <div>
        <label className="text-sm font-medium mb-1 block">Required Skills</label>
        <div className="flex gap-2 mb-2">
          <Input placeholder="Add a skill" value={skillInput} onChange={e => setSkillInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} />
          <Button type="button" variant="outline" size="sm" onClick={addSkill}>Add</Button>
        </div>
        <div className="flex flex-wrap gap-1">
          {skills.map((s, i) => (
            <Badge key={i} variant="secondary" className="gap-1">
              {s}
              <button onClick={() => setSkills(skills.filter((_, idx) => idx !== i))}><X className="h-3 w-3" /></button>
            </Badge>
          ))}
        </div>
      </div>

      {/* Deadline */}
      <div>
        <label className="text-sm font-medium mb-1 block">Application Deadline</label>
        <Input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
      </div>

      {/* Document */}
      <div>
        <label className="text-sm font-medium mb-1 block">Upload JD (PDF/DOC)</label>
        <input type="file" ref={docRef} className="hidden" accept=".pdf,.doc,.docx" onChange={e => setDocFile(e.target.files?.[0] || null)} />
        <Button variant="outline" size="sm" onClick={() => docRef.current?.click()} className="gap-1">
          <FileUp className="h-4 w-4" /> {docFile ? docFile.name : 'Choose file'}
        </Button>
      </div>

      {/* Custom Fields */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Custom Application Questions</label>
          <Button variant="outline" size="sm" onClick={addCustomField} className="gap-1">
            <Plus className="h-3 w-3" /> Add Question
          </Button>
        </div>
        {customFields.map((field, idx) => (
          <div key={idx} className="flex gap-2 mb-2 items-center">
            <Input placeholder="Question label" value={field.label}
              onChange={e => { const cf = [...customFields]; cf[idx].label = e.target.value; setCustomFields(cf); }} className="flex-1" />
            <Select value={field.type} onValueChange={v => { const cf = [...customFields]; cf[idx].type = v as any; setCustomFields(cf); }}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="textarea">Long Text</SelectItem>
                <SelectItem value="file">File Upload</SelectItem>
              </SelectContent>
            </Select>
            <label className="flex items-center gap-1 text-xs whitespace-nowrap">
              <input type="checkbox" checked={field.required}
                onChange={e => { const cf = [...customFields]; cf[idx].required = e.target.checked; setCustomFields(cf); }} />
              Required
            </label>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCustomFields(customFields.filter((_, i) => i !== idx))}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button onClick={handleSubmit} disabled={!form.title || !form.company || !form.description || posting} className="w-full">
        {posting ? 'Posting...' : 'Post Job'}
      </Button>
    </div>
  );
};

const JobCard: React.FC<{ job: any }> = ({ job }) => {
  const { user } = useAuth();
  const [applyOpen, setApplyOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: applicantCount = 0 } = useQuery({
    queryKey: ['job-applicants', job.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('job_applications')
        .select('*', { count: 'exact', head: true })
        .eq('job_id', job.id);
      return count || 0;
    },
  });

  const companyInitials = job.company
    ?.split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'CO';

  return (
    <div className="p-5 hover:bg-secondary/30 transition-colors">
      <div className="flex items-start gap-4">
        {/* Company avatar */}
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-extrabold text-primary">{companyInitials}</span>
        </div>

        {/* Job info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-base text-primary hover:underline cursor-pointer">{job.title}</h3>
              <p className="text-sm font-semibold text-foreground">{job.company}</p>
              <p className="text-sm text-muted-foreground">{job.location || 'Remote'}</p>
            </div>
            <button
              onClick={() => setSaved(!saved)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <Bookmark className={`h-5 w-5 ${saved ? 'fill-primary text-primary' : ''}`} />
            </button>
          </div>

          {job.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {job.skills.slice(0, 4).map((s: string, i: number) => (
                <Badge key={i} variant="secondary" className="text-xs font-bold">{s}</Badge>
              ))}
            </div>
          )}

          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{job.description}</p>

          {job.document_url && (
            <a href={job.document_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 inline-block font-bold">
              📄 View Job Description
            </a>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
              </span>
              {job.deadline && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Deadline: {new Date(job.deadline).toLocaleDateString()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-primary">{applicantCount} applicant{applicantCount !== 1 ? 's' : ''}</span>
              {user?.id !== job.user_id && (
                <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="rounded-full font-bold h-8 px-5">Apply</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Apply to {job.title}</DialogTitle></DialogHeader>
                    <ApplyForm job={job} onSuccess={() => setApplyOpen(false)} />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ApplyForm: React.FC<{ job: any; onSuccess: () => void }> = ({ job, onSuccess }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [fileAnswers, setFileAnswers] = useState<Record<string, File | null>>({});
  const [submitting, setSubmitting] = useState(false);
  const cvRef = useRef<HTMLInputElement>(null);

  const customFields: CustomField[] = (job.custom_fields as CustomField[]) || [];

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      let cvUrl = null;
      if (cvFile) {
        cvUrl = await uploadFile('cvs', user.id, cvFile);
      }
      // Upload file answers
      const finalAnswers = { ...answers };
      for (const [key, file] of Object.entries(fileAnswers)) {
        if (file) {
          const url = await uploadFile('cvs', user.id, file);
          finalAnswers[key] = url;
        }
      }

      await (supabase.from('job_applications') as any).insert({
        job_id: job.id,
        applicant_id: user.id,
        answers: finalAnswers,
        cv_url: cvUrl,
      });
      await supabase.from('notifications').insert({
        user_id: job.user_id,
        actor_id: user.id,
        type: 'job_application',
        post_id: job.id,
      });
      toast.success('Application submitted!');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* CV Upload */}
      <div>
        <label className="text-sm font-medium mb-1 block">Upload CV *</label>
        <input type="file" ref={cvRef} className="hidden" accept=".pdf,.doc,.docx" onChange={e => setCvFile(e.target.files?.[0] || null)} />
        <Button variant="outline" size="sm" onClick={() => cvRef.current?.click()} className="gap-1">
          <FileUp className="h-4 w-4" /> {cvFile ? cvFile.name : 'Choose CV'}
        </Button>
      </div>

      {/* Custom fields */}
      {customFields.map((field, idx) => (
        <div key={idx}>
          <label className="text-sm font-medium mb-1 block">
            {field.label} {field.required && <span className="text-destructive">*</span>}
          </label>
          {field.type === 'text' && (
            <Input value={answers[field.label] || ''} onChange={e => setAnswers(a => ({ ...a, [field.label]: e.target.value }))} />
          )}
          {field.type === 'textarea' && (
            <Textarea value={answers[field.label] || ''} onChange={e => setAnswers(a => ({ ...a, [field.label]: e.target.value }))} />
          )}
          {field.type === 'file' && (
            <Input type="file" onChange={e => setFileAnswers(fa => ({ ...fa, [field.label]: e.target.files?.[0] || null }))} />
          )}
        </div>
      ))}

      <Button onClick={handleSubmit} disabled={submitting || !cvFile} className="w-full">
        {submitting ? 'Submitting...' : 'Submit Application'}
      </Button>
    </div>
  );
};

export default Jobs;
