// database-functions.js

// supabase client initialization
const SUPABASE_URL = 'https://asccuwumidjqcwdcmsrp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzY2N1d3VtaWRqcWN3ZGNtc3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyNjk1OTQsImV4cCI6MjA2Njg0NTU5NH0.eqmYPNdSoIjvAxKFlR4c-xQzW4FomEWSEe7nv-X4mFU';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// login page functions
// ==============================================================================
export async function fetchStudentUsingNameAndEmail(name, email) {

    const { data, error } = await supabaseClient
        .from('Users')
        .select('*')
        .eq('name', name)
        .eq('email', email);
    
    return { data, error };

}

export async function insertNewUser(name, email) {

    const { data, error } = await supabaseClient
        .from('Users')
        .insert({ name, email })
        .select();

    return { data, error };

}

export async function initializeUserRowInNecessaryTables(user_id) {

    const { data: dataUploads, error: errorUploads } = await supabaseClient
        .from('Uploads2')
        .insert({ user_id })
        .select();

    const { data: dataUploadsMarks, error: errorUploadsMarks } = await supabaseClient
        .from('UploadsMarks2')
        .insert({ user_id })
        .select();

    // return a merged version of both errors
    return { error: errorUploads || errorUploadsMarks };

}

export async function fetchAdminIdUsingEmail(email) {

    const { data, error } = await supabaseClient
    .from('Admins')
    .select('id')
    .eq('email', email)
    .single();

    return { data, error };

}
// ==============================================================================

// student dashboard functions
// ==============================================================================
export async function fetchStudentUploads2(userId) {

    const { data, error } = await supabaseClient
        .from('Uploads2')
        .select('*')
        .eq('user_id', userId)
        .single();

    return { data, error };

}

export async function fetchSpecificStudentUploads2(userId, columnName) {

  const { data, error } = await supabaseClient
    .from('Uploads2')
    .select(columnName)
    .eq('user_id', userId)
    .single();

  return { data, error };

}

export async function updateSpecificStudentUploads2(userId, columnName, newValue) {

    await supabaseClient.from('Uploads2')
    .update({ [columnName]: newValue })
    .eq('user_id', userId);

}

export async function fetchSpecificLinkName(url, userId, columnName) {

    const { data: linkNameData } = await supabaseClient
      .from('LinkNames')
      .select('name')
      .eq('link', url)
      .eq('user_id', userId)
      .eq('column_name', columnName)
      .single();

    return linkNameData;

}

export async function deleteSpecificLinkName(url, userId, columnName) {

    await supabaseClient.from('LinkNames')
    .delete()
    .eq('link', url)
    .eq('user_id', userId)
    .eq('column_name', columnName);

}

export async function uploadFileToStorage(file) {

    const path = `${Date.now()}-${file.name}`;
    const { error: upErr } = await supabaseClient.storage.from('files-and-links').upload(path, file);
    return upErr

}

export async function fetchPublicUrlFromStorage(path) {

    const { data: pub } = await supabaseClient.storage.from('files-and-links').getPublicUrl(path);
    return pub;

}

export async function createNewLinkName(linkName, url, userId, columnName) {

    await supabaseClient.from('LinkNames')
    .insert({ name: linkName, link: url, user_id: userId, column_name: columnName });

}
// ==============================================================================

// admin dashboard functions
// ==============================================================================
export async function fetchUsersUsingAdminId(adminId) {

  const { data, error } = await supabaseClient
    .from('Users')
    .select('id,name,email')
    .eq('admin', adminId);

  return { data, error };

}

export async function fetchMarksParent(userId, parent) {

    const { data, error } = await supabaseClient
        .from('UploadsMarks2')
        .select(parent)
        .eq('user_id', userId)
        .single();

    return { data, error };

}

export async function updateMarksForUser(userId, updates) {

    const { data, error } = await supabaseClient
        .from('UploadsMarks2')
        .update(updates)
        .eq('user_id', userId);

    return { data, error };

}

export async function fetchMarksForUser(userId) {

    const { data, error } = await supabaseClient
        .from('UploadsMarks2')
        .select('*')
        .eq('user_id', userId)
        .single();

    return { data, error };

}

export async function fetchMarksForUsers(ids) {

    const { data, error } = await supabaseClient
        .from('UploadsMarks2')
        .select('*')
        .in('user_id', ids);

    return { data, error };

}

export async function fetchUploadsForUsers(ids) {

    const { data, error } = await supabaseClient
        .from('Uploads2')
        .select('*')
        .in('user_id', ids);

    return { data, error };

}
// ==============================================================================