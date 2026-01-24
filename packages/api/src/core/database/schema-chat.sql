-- ============================================
-- CHAT & MESSAGING SCHEMA ADDITIONS
-- ============================================

-- ============================================
-- CONVERSATIONS (Chat threads between users)
-- ============================================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
  
  -- Last activity
  last_message_at TIMESTAMP,
  last_message_preview TEXT,
  
  -- Unread counts
  tenant_unread_count INTEGER DEFAULT 0,
  landlord_unread_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(match_id)
);

CREATE INDEX idx_conversations_tenant ON conversations(tenant_id);
CREATE INDEX idx_conversations_landlord ON conversations(landlord_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

-- ============================================
-- MESSAGES (Individual chat messages)
-- ============================================

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Message content
  message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'voice', 'document', 'system')),
  content TEXT NOT NULL,
  
  -- Media (for images, voice notes, documents)
  media_url TEXT,
  media_thumbnail_url TEXT,
  media_duration INTEGER, -- For voice notes (seconds)
  
  -- Quick reply (if used)
  is_quick_reply BOOLEAN DEFAULT FALSE,
  quick_reply_template VARCHAR(255),
  
  -- Status
  status VARCHAR(50) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_messages_status ON messages(status);

-- ============================================
-- VIEWING SCHEDULES
-- ============================================

CREATE TABLE viewings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Scheduling
  proposed_datetime TIMESTAMP NOT NULL,
  alternative_datetime TIMESTAMP,
  confirmed_datetime TIMESTAMP,
  duration_minutes INTEGER DEFAULT 30,
  
  -- Status
  status VARCHAR(50) DEFAULT 'proposed' CHECK (status IN (
    'proposed',      -- Tenant proposed time
    'counter',       -- Landlord proposed alternative
    'confirmed',     -- Both agreed
    'completed',     -- Viewing happened
    'cancelled',     -- Cancelled by either party
    'no_show'        -- One party didn't show
  )),
  
  -- Cancellation
  cancelled_by UUID REFERENCES users(id),
  cancellation_reason TEXT,
  
  -- Notes
  tenant_notes TEXT,
  landlord_notes TEXT,
  
  -- Post-viewing feedback
  viewing_rating INTEGER CHECK (viewing_rating >= 1 AND viewing_rating <= 5),
  viewing_feedback TEXT,
  
  -- Reminders
  reminder_24h_sent BOOLEAN DEFAULT FALSE,
  reminder_2h_sent BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_viewings_tenant ON viewings(tenant_id);
CREATE INDEX idx_viewings_landlord ON viewings(landlord_id);
CREATE INDEX idx_viewings_property ON viewings(property_id);
CREATE INDEX idx_viewings_datetime ON viewings(confirmed_datetime);
CREATE INDEX idx_viewings_status ON viewings(status);

-- ============================================
-- QUICK REPLY TEMPLATES
-- ============================================

CREATE TABLE quick_reply_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Template info
  category VARCHAR(100) NOT NULL, -- 'greeting', 'scheduling', 'inquiry', 'closing'
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  
  -- Targeting
  user_role VARCHAR(50) CHECK (user_role IN ('tenant', 'landlord', 'both')),
  
  -- Usage stats
  usage_count INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed default quick reply templates
INSERT INTO quick_reply_templates (category, title, content, user_role) VALUES
  ('greeting', 'Introduction', 'Hi! I am interested in your property. When would be a good time to schedule a viewing?', 'tenant'),
  ('scheduling', 'Schedule Viewing', 'When can I schedule a viewing? I am available this week.', 'tenant'),
  ('inquiry', 'Availability Check', 'Is this property still available?', 'tenant'),
  ('inquiry', 'Utility Bills', 'Can you share the average monthly utility bills for this property?', 'tenant'),
  ('inquiry', 'Pet Policy', 'Do you allow pets in this property?', 'tenant'),
  ('inquiry', 'Parking', 'Is covered parking included in the rent?', 'tenant'),
  ('greeting', 'Welcome Response', 'Thank you for your interest! I would be happy to show you the property.', 'landlord'),
  ('scheduling', 'Propose Time', 'I am available for viewings on weekends between 10 AM - 6 PM. What works for you?', 'landlord'),
  ('inquiry', 'Request Documents', 'Could you please share your employment proof and ID for verification?', 'landlord');

-- ============================================
-- TRIGGERS FOR CHAT
-- ============================================

CREATE TRIGGER conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER viewings_updated_at BEFORE UPDATE ON viewings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- FUNCTION: Update conversation on new message
-- ============================================

CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last message info
  UPDATE conversations
  SET 
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 100),
    updated_at = CURRENT_TIMESTAMP,
    -- Increment unread count for recipient
    tenant_unread_count = CASE 
      WHEN NEW.sender_id != tenant_id THEN tenant_unread_count + 1 
      ELSE tenant_unread_count 
    END,
    landlord_unread_count = CASE 
      WHEN NEW.sender_id != landlord_id THEN landlord_unread_count + 1 
      ELSE landlord_unread_count 
    END
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_update_conversation 
AFTER INSERT ON messages 
FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();
