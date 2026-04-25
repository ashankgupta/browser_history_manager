const API_BASE = 'http://localhost:3000';

async function apiCall(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) options.body = JSON.stringify(body);
  
  const response = await fetch(`${API_BASE}${endpoint}`, options);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'An error occurred');
  }
  
  return data;
}

export const navigationApi = {
  visit: (url) => apiCall('/visit', 'POST', { url }),
  navigate: (url, fromHistory = false) => apiCall('/navigate', 'POST', { url, fromHistory }),
  back: () => apiCall('/back', 'POST'),
  forward: () => apiCall('/forward', 'POST'),
  getCurrent: () => apiCall('/current'),
};

export const bookmarkApi = {
  add: (url, title, folder = 'default') => 
    apiCall('/bookmarks', 'POST', { url, title, folder }),
  getByFolder: (folder) => 
    apiCall(`/bookmarks/${encodeURIComponent(folder)}`),
  search: (query) => 
    apiCall(`/bookmarks/search?q=${encodeURIComponent(query)}`),
  getFolders: () => 
    apiCall('/bookmarks/folders'),
  remove: (id, folder) => 
    apiCall(`/bookmarks/${id}?folder=${encodeURIComponent(folder)}`, 'DELETE'),
  deleteFolder: (folder) => 
    apiCall(`/bookmarks/folder/${encodeURIComponent(folder)}`, 'DELETE'),
};

export const historyApi = {
  getRecent: (count = 20, offset = 0) => 
    apiCall(`/history/recent?count=${count}&offset=${offset}`),
  search: (query) => 
    apiCall(`/history/search?q=${encodeURIComponent(query)}`),
  getAll: () => 
    apiCall('/history'),
  clear: () => 
    apiCall('/history', 'DELETE'),
  remove: (id) => 
    apiCall(`/history/${id}`, 'DELETE'),
};

export const aiApi = {
  configure: (apiKey) => 
    apiCall('/ai/configure', 'POST', { apiKey }),
  getStatus: () => 
    apiCall('/ai/configure'),
  getSuggestions: (query) => 
    apiCall(`/ai/suggestions?q=${encodeURIComponent(query)}`),
};
