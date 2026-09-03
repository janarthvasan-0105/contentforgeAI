const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://udcfajohgxsjzhsljata.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkY2Zham9oZ3hzanpoc2xqYXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5NzUwODAsImV4cCI6MjA5NjU1MTA4MH0.sJDJzpYMDoDAjnFJQsd8ovyKJQshXgz_xwggxr-uwAI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const { data, error } = await supabase.from('blogs').insert([{
        title: 'Test',
        topic: 'Test',
        category: 'Test',
        content: '{}',
        seo_score: 100,
        status: 'draft'
    }]).select();
    console.log('Error:', error);
    console.log('Data:', data);
}
test();
