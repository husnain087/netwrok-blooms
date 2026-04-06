import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

const MentionInput: React.FC<MentionInputProps> = ({ value, onChange, placeholder, className, autoFocus }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [cursorPos, setCursorPos] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query || query.length < 1) {
      setSuggestions([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, headline')
        .ilike('full_name', `%${query}%`)
        .limit(5);
      setSuggestions(data || []);
    }, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const pos = e.target.selectionStart || 0;
    onChange(newValue);
    setCursorPos(pos);

    // Check if we're in a mention context
    const textBeforeCursor = newValue.substring(0, pos);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    
    if (atIndex !== -1) {
      const charBeforeAt = atIndex > 0 ? textBeforeCursor[atIndex - 1] : ' ';
      if (charBeforeAt === ' ' || charBeforeAt === '\n' || atIndex === 0) {
        const searchText = textBeforeCursor.substring(atIndex + 1);
        if (!searchText.includes(' ') || searchText.length <= 30) {
          setMentionStart(atIndex);
          setQuery(searchText);
          setShowSuggestions(true);
          return;
        }
      }
    }
    setShowSuggestions(false);
    setQuery('');
  };

  const selectMention = (profile: any) => {
    const name = profile.full_name || 'User';
    const before = value.substring(0, mentionStart);
    const after = value.substring(cursorPos);
    const newValue = `${before}@${name} ${after}`;
    onChange(newValue);
    setShowSuggestions(false);
    setQuery('');
    
    // Focus back and set cursor
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = mentionStart + name.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className={className}
        autoFocus={autoFocus}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute left-0 right-0 top-full mt-1 bg-card border rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto"
        >
          {suggestions.map(p => (
            <button
              key={p.user_id}
              className="w-full flex items-center gap-2 p-2.5 hover:bg-secondary transition-colors text-left"
              onClick={() => selectMention(p)}
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src={p.avatar_url || ''} />
                <AvatarFallback className="text-xs">{p.full_name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{p.full_name}</p>
                {p.headline && <p className="text-xs text-muted-foreground truncate">{p.headline}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentionInput;
