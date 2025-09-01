// Test script for share link expiration flow
// This script simulates the creation and expiration of share links

// Node.js polyfill for btoa
function btoa(str) {
  return Buffer.from(str).toString('base64');
}

// Node.js polyfill for localStorage
const localStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  }
};

// Mock project data
const mockProject = {
  id: 'test-project',
  name: 'Test Project',
  image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  pins: [
    {
      id: 'pin1',
      x: 25,
      y: 25,
      comment: 'Test comment 1',
      status: 'pending',
      color: '#FF4D4F'
    }
  ]
};

// Create a share link with expiration
function createShareLink(project, expirationDays) {
  const projectData = btoa(JSON.stringify(project));
  const shareUrl = `http://localhost:5179/view?data=${encodeURIComponent(projectData)}`;
  
  // Calculate expiration date
  let expiresAt = null;
  if (expirationDays) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);
  }
  
  const newLink = {
    id: Date.now().toString(),
    url: shareUrl,
    projectId: project.id,
    createdAt: new Date(),
    expiresAt
  };
  
  // Store in localStorage
  const existingLinks = JSON.parse(localStorage.getItem('pinner_share_links') || '[]');
  existingLinks.push(newLink);
  localStorage.setItem('pinner_share_links', JSON.stringify(existingLinks));
  
  return { shareUrl, expiresAt };
}

// Test creating a link that expires in 1 day
const oneDayLink = createShareLink(mockProject, 1);
console.log('Created link that expires in 1 day:', oneDayLink);

// Test creating a link that expires in 7 days
const sevenDayLink = createShareLink(mockProject, 7);
console.log('Created link that expires in 7 days:', sevenDayLink);

// Test creating a link that never expires
const noExpirationLink = createShareLink(mockProject, null);
console.log('Created link with no expiration:', noExpirationLink);

// Test creating an expired link (expired 1 day ago)
function createExpiredLink() {
  const projectData = btoa(JSON.stringify(mockProject));
  const shareUrl = `http://localhost:5179/view?data=${encodeURIComponent(projectData)}`;
  
  // Set expiration to yesterday
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() - 1);
  
  const newLink = {
    id: 'expired-link',
    url: shareUrl,
    projectId: mockProject.id,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
    expiresAt
  };
  
  // Store in localStorage
  const existingLinks = JSON.parse(localStorage.getItem('pinner_share_links') || '[]');
  existingLinks.push(newLink);
  localStorage.setItem('pinner_share_links', JSON.stringify(existingLinks));
  
  return { shareUrl, expiresAt };
}

const expiredLink = createExpiredLink();
console.log('Created expired link:', expiredLink);

// Instructions for testing:
console.log('\nTesting instructions:');
console.log('1. Open the expired link in your browser - you should be redirected to the 404 page');
console.log('2. Open the non-expired links - they should display the project correctly');
console.log('3. To test the ShareOptionsModal, click the Share button in the app');
