// Run migration: add professional_title column to profiles
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://fnqmbrqrewzmcusbxywq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZucW1icnFyZXd6bWN1c2J4eXdxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTkyMDgyNywiZXhwIjoyMDkxNDk2ODI3fQ.nE6OCzLNj6JIF5AB7WoURggIzD0iA2rDfr0vAYD3bYw'
);

async function run() {
  const { data, error } = await supabase.rpc('', undefined).throwOnError();
  // RPC won't work for DDL. Let's try a different approach.
  // We'll just verify the column can be accessed by trying to select it.
  
  // Actually, let's use the SQL endpoint via fetch
  const res = await fetch('https://fnqmbrqrewzmcusbxywq.supabase.co/rest/v1/rpc/', {
    method: 'POST',
    headers: {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZucW1icnFyZXd6bWN1c2J4eXdxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTkyMDgyNywiZXhwIjoyMDkxNDk2ODI3fQ.nE6OCzLNj6JIF5AB7WoURggIzD0iA2rDfr0vAYD3bYw',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZucW1icnFyZXd6bWN1c2J4eXdxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTkyMDgyNywiZXhwIjoyMDkxNDk2ODI3fQ.nE6OCzLNj6JIF5AB7WoURggIzD0iA2rDfr0vAYD3bYw',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({})
  });
  console.log('Status:', res.status);
}

run();
