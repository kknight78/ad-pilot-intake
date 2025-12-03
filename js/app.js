// Ad Pilot Intake Form - JavaScript
const WEBHOOK_URL = 'https://kelly-ads.app.n8n.cloud/webhook/client-intake';
const WEBHOOK_UPDATE_URL = 'https://kelly-ads.app.n8n.cloud/webhook/client-update';
const WEBHOOK_LIST_URL = 'https://kelly-ads.app.n8n.cloud/webhook/client-list';
const WEBHOOK_GET_URL = 'https://kelly-ads.app.n8n.cloud/webhook/client-get';
const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/dtpqxuwby/auto/upload';
const CLOUDINARY_UPLOAD_PRESET = 'intake_unsigned';

let currentSection = 1;
const totalSections = 8;
let uploadedFiles = {};
let avatarCount = 1;
let portalUserCount = 0;
let editMode = false;
let editingClientId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupFormValidation();
});

// Client Selector Functions
function startNewClient() {
  editMode = false;
  editingClientId = null;
  document.getElementById('clientSelector').style.display = 'none';
  document.getElementById('intakeForm').style.display = 'block';
  document.getElementById('editBanner').style.display = 'none';
  updateProgress();
}

async function showClientList() {
  const dropdown = document.getElementById('clientDropdown');
  const loading = document.getElementById('clientLoading');
  const select = document.getElementById('clientSelect');

  dropdown.style.display = 'block';
  loading.style.display = 'flex';
  select.style.display = 'none';

  try {
    const response = await fetch(WEBHOOK_LIST_URL);
    const data = await response.json();

    // Populate dropdown
    select.innerHTML = '<option value="">Select a client...</option>';
    data.clients.forEach(client => {
      const option = document.createElement('option');
      option.value = client.clientId;
      option.textContent = `${client.businessName} (${client.clientId})`;
      select.appendChild(option);
    });

    loading.style.display = 'none';
    select.style.display = 'block';
  } catch (error) {
    console.error('Failed to load clients:', error);
    loading.innerHTML = 'Failed to load clients. Please try again.';
  }
}

async function loadSelectedClient() {
  const clientId = document.getElementById('clientSelect').value;
  if (!clientId) return;

  const loading = document.getElementById('clientLoading');
  loading.style.display = 'flex';
  loading.innerHTML = '<svg class="spinner" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="40" stroke-dashoffset="10"/></svg> Loading client...';

  try {
    const response = await fetch(`${WEBHOOK_GET_URL}?clientId=${encodeURIComponent(clientId)}`);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // Switch to edit mode
    editMode = true;
    editingClientId = clientId;

    // Show form with edit banner
    document.getElementById('clientSelector').style.display = 'none';
    document.getElementById('intakeForm').style.display = 'block';
    document.getElementById('editBanner').style.display = 'flex';
    document.getElementById('editClientName').textContent = data.client.businessName;
    document.getElementById('editClientId').textContent = clientId;

    // Populate form with client data
    populateForm(data.client);

    updateProgress();
  } catch (error) {
    console.error('Failed to load client:', error);
    alert('Failed to load client. Please try again.');
    loading.style.display = 'none';
  }
}

function populateForm(client) {
  // Section 1: Business Info
  document.getElementById('businessName').value = client.businessName || '';
  document.getElementById('businessAddress').value = client.businessAddress || '';
  document.getElementById('businessPhone').value = client.businessPhone || '';
  document.getElementById('websiteUrl').value = client.websiteUrl || '';
  document.getElementById('socialHandle').value = client.socialHandle || '';
  document.getElementById('industry').value = client.industry || '';

  // Section 2: Platforms
  const platforms = Array.isArray(client.platforms) ? client.platforms : [];
  document.querySelectorAll('input[name="platforms"]').forEach(cb => {
    cb.checked = platforms.includes(cb.value);
    if (cb.checked) {
      togglePlatformStatus(cb);
      // Set the status value
      const statusKey = cb.value.replace(/[^a-zA-Z]/g, '');
      const statusSelect = document.querySelector(`select[name="platformStatus_${statusKey}"]`);
      if (statusSelect && client.platformStatuses && client.platformStatuses[cb.value]) {
        statusSelect.value = client.platformStatuses[cb.value];
      }
    }
  });
  document.getElementById('platformEmail').value = client.platformEmail || '';
  document.getElementById('platformNotes').value = client.platformNotes || '';

  // Section 3: Portal Access
  document.getElementById('primaryContactName').value = client.primaryContactName || '';
  document.getElementById('primaryContactEmail').value = client.primaryContactEmail || '';
  document.getElementById('primaryContactPhone').value = client.primaryContactPhone || '';

  // Additional users
  const additionalUsers = Array.isArray(client.additionalUsers) ? client.additionalUsers : [];
  additionalUsers.forEach(user => {
    addPortalUser();
    document.querySelector(`input[name="additionalUserName_${portalUserCount}"]`).value = user.name || '';
    document.querySelector(`input[name="additionalUserEmail_${portalUserCount}"]`).value = user.email || '';
  });

  // Section 4: Verification Docs
  document.getElementById('ownerName').value = client.ownerName || '';
  if (client.businessLicenseUrl) {
    uploadedFiles['businessLicense'] = client.businessLicenseUrl;
    showExistingFile('businessLicenseUpload', client.businessLicenseUrl);
  }
  if (client.ownerIdFrontUrl) {
    uploadedFiles['ownerIdFront'] = client.ownerIdFrontUrl;
    showExistingFile('ownerIdFrontUpload', client.ownerIdFrontUrl);
  }
  if (client.ownerIdBackUrl) {
    uploadedFiles['ownerIdBack'] = client.ownerIdBackUrl;
    showExistingFile('ownerIdBackUpload', client.ownerIdBackUrl);
  }

  // Section 5: Brand Assets
  if (client.logoUrl) {
    uploadedFiles['logo'] = client.logoUrl;
    showExistingFile('logoUpload', client.logoUrl);
  }
  document.getElementById('brandColors').value = client.brandColors || '';
  document.getElementById('tagline').value = client.tagline || '';
  if (client.exteriorPhotoUrl) {
    uploadedFiles['exteriorPhoto'] = client.exteriorPhotoUrl;
    showExistingFile('exteriorPhotoUpload', client.exteriorPhotoUrl);
  }
  if (client.interiorPhotoUrl) {
    uploadedFiles['interiorPhoto'] = client.interiorPhotoUrl;
    showExistingFile('interiorPhotoUpload', client.interiorPhotoUrl);
  }

  // Section 6: Avatar People
  const avatarPeople = Array.isArray(client.avatarPeople) ? client.avatarPeople : [];
  if (avatarPeople.length > 0) {
    // Fill first person
    document.querySelector('input[name="avatarName_0"]').value = avatarPeople[0].name || '';
    document.querySelector('input[name="avatarEmail_0"]').value = avatarPeople[0].email || '';
    document.querySelector('input[name="avatarRole_0"]').value = avatarPeople[0].role || '';
    document.querySelector('input[name="avatarPrimary_0"]').checked = avatarPeople[0].isPrimary || false;

    // Add additional people
    for (let i = 1; i < avatarPeople.length; i++) {
      addAvatarPerson();
      document.querySelector(`input[name="avatarName_${i}"]`).value = avatarPeople[i].name || '';
      document.querySelector(`input[name="avatarEmail_${i}"]`).value = avatarPeople[i].email || '';
      document.querySelector(`input[name="avatarRole_${i}"]`).value = avatarPeople[i].role || '';
      document.querySelector(`input[name="avatarPrimary_${i}"]`).checked = avatarPeople[i].isPrimary || false;
    }
  }

  // Section 7: Plan & Pricing
  document.getElementById('selectedPlan').value = client.selectedPlan || '';
  const addons = Array.isArray(client.addons) ? client.addons : [];
  document.querySelectorAll('input[name="addons"]').forEach(cb => {
    cb.checked = addons.includes(cb.value);
  });
  document.getElementById('onboardingComplexity').value = client.onboardingComplexity || '';
  document.getElementById('onboardingTotal').value = client.onboardingTotal || '0';
  document.getElementById('calculatedTotal').textContent = `$${parseInt(client.onboardingTotal || 0).toLocaleString()}`;

  // Section 8: Notes
  document.getElementById('meetingNotes').value = client.meetingNotes || '';
  document.getElementById('followUpItems').value = client.followUpItems || '';
  document.getElementById('redFlags').value = client.redFlags || '';
}

function showExistingFile(containerId, url) {
  const container = document.getElementById(containerId);
  const preview = container.querySelector('.file-preview');
  container.classList.add('has-file');

  if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    preview.innerHTML = `<img src="${url}" alt="Uploaded file">`;
  } else {
    preview.innerHTML = `<div class="file-name"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M9 1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V5L9 1z" stroke="currentColor" stroke-width="1.5"/></svg>File uploaded</div>`;
  }
}

function backToSelector() {
  // Reset form and go back to selector
  resetFormState();
  document.getElementById('intakeForm').style.display = 'none';
  document.getElementById('clientSelector').style.display = 'block';
  document.getElementById('clientDropdown').style.display = 'none';
}

function resetFormState() {
  document.getElementById('intakeForm').reset();
  currentSection = 1;
  avatarCount = 1;
  portalUserCount = 0;
  uploadedFiles = {};
  editMode = false;
  editingClientId = null;

  // Reset UI
  document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
  document.querySelector('.form-section[data-section="1"]').classList.add('active');
  document.querySelectorAll('.progress-steps .step').forEach(s => {
    s.classList.remove('active', 'completed');
  });
  document.querySelector('.progress-steps .step[data-section="1"]').classList.add('active');

  // Clear dynamic content
  document.getElementById('platformStatuses').innerHTML = '';
  document.getElementById('additionalUsers').innerHTML = '';
  resetAvatarPeople();

  // Clear file uploads
  document.querySelectorAll('.file-upload').forEach(upload => {
    upload.classList.remove('has-file');
    upload.querySelector('.file-preview').innerHTML = '';
  });
}

function resetAvatarPeople() {
  document.getElementById('avatarPeople').innerHTML = `
    <div class="repeatable-entry avatar-entry" data-index="0">
      <div class="entry-header">
        <span class="entry-title">Person 1</span>
        <button type="button" class="btn-remove" onclick="removeAvatarPerson(this)" style="display:none;">Remove</button>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Name</label>
          <input type="text" name="avatarName_0">
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" name="avatarEmail_0">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Role/Title</label>
          <input type="text" name="avatarRole_0" placeholder="e.g., Owner, Sales Manager">
        </div>
        <div class="form-group checkbox-inline">
          <label class="checkbox-label">
            <input type="checkbox" name="avatarPrimary_0">
            <span class="checkmark"></span>
            Primary contact for avatar recordings
          </label>
        </div>
      </div>
    </div>
  `;
}

// Section Navigation
function nextSection() {
  if (validateCurrentSection()) {
    if (currentSection < totalSections) {
      showSection(currentSection + 1);
    }
  }
}

function prevSection() {
  if (currentSection > 1) {
    showSection(currentSection - 1);
  }
}

function showSection(sectionNum) {
  // Hide current section
  document.querySelector(`.form-section[data-section="${currentSection}"]`).classList.remove('active');
  document.querySelector(`.progress-steps .step[data-section="${currentSection}"]`).classList.remove('active');
  document.querySelector(`.progress-steps .step[data-section="${currentSection}"]`).classList.add('completed');

  // Show new section
  currentSection = sectionNum;
  document.querySelector(`.form-section[data-section="${currentSection}"]`).classList.remove('active');
  document.querySelector(`.form-section[data-section="${currentSection}"]`).classList.add('active');
  document.querySelector(`.progress-steps .step[data-section="${currentSection}"]`).classList.add('active');
  document.querySelector(`.progress-steps .step[data-section="${currentSection}"]`).classList.remove('completed');

  updateProgress();

  // Scroll to top of form
  document.querySelector('.intake-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateProgress() {
  const progress = (currentSection / totalSections) * 100;
  document.getElementById('progressFill').style.width = `${progress}%`;
}

// Click on progress step to navigate
document.querySelectorAll('.progress-steps .step').forEach(step => {
  step.addEventListener('click', () => {
    const targetSection = parseInt(step.dataset.section);
    if (targetSection <= currentSection || validateCurrentSection()) {
      showSection(targetSection);
    }
  });
});

// Validation
function setupFormValidation() {
  const form = document.getElementById('intakeForm');
  form.addEventListener('submit', handleSubmit);
}

function validateCurrentSection() {
  const section = document.querySelector(`.form-section[data-section="${currentSection}"]`);
  const requiredFields = section.querySelectorAll('[required]');
  let valid = true;

  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      valid = false;
      field.classList.add('error');
      field.addEventListener('input', () => field.classList.remove('error'), { once: true });
    }
  });

  // Special validation for platforms section
  if (currentSection === 2) {
    const platformCheckboxes = document.querySelectorAll('input[name="platforms"]:checked');
    if (platformCheckboxes.length === 0) {
      valid = false;
      alert('Please select at least one platform.');
    }
  }

  if (!valid) {
    const firstError = section.querySelector('.error');
    if (firstError) {
      firstError.focus();
    }
  }

  return valid;
}

// Platform Status Toggle
function togglePlatformStatus(checkbox) {
  const container = document.getElementById('platformStatuses');
  const platform = checkbox.value;

  if (checkbox.checked) {
    const row = document.createElement('div');
    row.className = 'platform-status-row';
    row.id = `status-${platform.replace(/[^a-zA-Z]/g, '')}`;
    row.innerHTML = `
      <span class="platform-name">${platform}</span>
      <select name="platformStatus_${platform.replace(/[^a-zA-Z]/g, '')}" required>
        <option value="">Select status...</option>
        <option value="Green">Green - Easy access</option>
        <option value="Yellow">Yellow - Some setup needed</option>
        <option value="Red">Red - Major issues</option>
      </select>
    `;
    container.appendChild(row);
  } else {
    const row = document.getElementById(`status-${platform.replace(/[^a-zA-Z]/g, '')}`);
    if (row) row.remove();
  }

  // Recalculate onboarding total
  calculateOnboardingTotal();
}

// Portal Users
function addPortalUser() {
  const container = document.getElementById('additionalUsers');
  portalUserCount++;

  const entry = document.createElement('div');
  entry.className = 'repeatable-entry';
  entry.innerHTML = `
    <div class="entry-header">
      <span class="entry-title">Additional User ${portalUserCount}</span>
      <button type="button" class="btn-remove" onclick="removeEntry(this)">Remove</button>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Name</label>
        <input type="text" name="additionalUserName_${portalUserCount}">
      </div>
      <div class="form-group">
        <label>Email</label>
        <input type="email" name="additionalUserEmail_${portalUserCount}">
      </div>
    </div>
  `;
  container.appendChild(entry);
}

// Avatar People
function addAvatarPerson() {
  const container = document.getElementById('avatarPeople');
  avatarCount++;

  // Show remove button on first entry
  const firstRemoveBtn = container.querySelector('.btn-remove');
  if (firstRemoveBtn) firstRemoveBtn.style.display = 'block';

  const entry = document.createElement('div');
  entry.className = 'repeatable-entry avatar-entry';
  entry.dataset.index = avatarCount - 1;
  entry.innerHTML = `
    <div class="entry-header">
      <span class="entry-title">Person ${avatarCount}</span>
      <button type="button" class="btn-remove" onclick="removeAvatarPerson(this)">Remove</button>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Name</label>
        <input type="text" name="avatarName_${avatarCount - 1}">
      </div>
      <div class="form-group">
        <label>Email</label>
        <input type="email" name="avatarEmail_${avatarCount - 1}">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Role/Title</label>
        <input type="text" name="avatarRole_${avatarCount - 1}" placeholder="e.g., Owner, Sales Manager">
      </div>
      <div class="form-group checkbox-inline">
        <label class="checkbox-label">
          <input type="checkbox" name="avatarPrimary_${avatarCount - 1}">
          <span class="checkmark"></span>
          Primary contact for avatar recordings
        </label>
      </div>
    </div>
  `;
  container.appendChild(entry);
}

function removeAvatarPerson(btn) {
  const entry = btn.closest('.avatar-entry');
  entry.remove();

  // Renumber remaining entries
  const entries = document.querySelectorAll('.avatar-entry');
  avatarCount = entries.length;
  entries.forEach((e, i) => {
    e.querySelector('.entry-title').textContent = `Person ${i + 1}`;
  });

  // Hide remove button if only one entry left
  if (entries.length === 1) {
    entries[0].querySelector('.btn-remove').style.display = 'none';
  }
}

function removeEntry(btn) {
  btn.closest('.repeatable-entry').remove();
}

// Calculate Onboarding Total
function calculateOnboardingTotal() {
  const complexitySelect = document.getElementById('onboardingComplexity');
  const selectedOption = complexitySelect.options[complexitySelect.selectedIndex];
  const costPerPlatform = selectedOption ? parseInt(selectedOption.dataset.cost) || 0 : 0;

  const platformCount = document.querySelectorAll('input[name="platforms"]:checked').length;
  const total = costPerPlatform * platformCount;

  document.getElementById('calculatedTotal').textContent = `$${total.toLocaleString()}`;
  document.getElementById('onboardingTotal').value = total;
}

// File Upload Handling
async function handleFileUpload(input, containerId) {
  const container = document.getElementById(containerId);
  const preview = container.querySelector('.file-preview');
  const file = input.files[0];

  if (!file) return;

  container.classList.add('has-file');

  // Show preview
  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
    };
    reader.readAsDataURL(file);
  } else {
    preview.innerHTML = `<div class="file-name"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M9 1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V5L9 1z" stroke="currentColor" stroke-width="1.5"/></svg>${file.name}</div>`;
  }

  // Upload to Cloudinary
  try {
    const url = await uploadToCloudinary(file);
    uploadedFiles[input.name] = url;
  } catch (error) {
    console.error('Upload failed:', error);
    alert('File upload failed. Please try again.');
  }
}

async function handleMultiFileUpload(input, containerId) {
  const container = document.getElementById(containerId);
  const preview = container.querySelector('.file-preview');
  const files = Array.from(input.files);

  if (!files.length) return;

  container.classList.add('has-file');
  preview.innerHTML = '';

  uploadedFiles[input.name] = [];

  for (const file of files) {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        preview.innerHTML += `<img src="${e.target.result}" alt="Preview">`;
      };
      reader.readAsDataURL(file);
    }

    try {
      const url = await uploadToCloudinary(file);
      uploadedFiles[input.name].push(url);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  }
}

async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'intake');

  const response = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  const data = await response.json();
  return data.secure_url;
}

// Form Submission
async function handleSubmit(e) {
  e.preventDefault();

  if (!validateCurrentSection()) return;

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.classList.add('loading');
  submitBtn.disabled = true;

  try {
    const formData = collectFormData();

    // Use update URL if in edit mode
    const url = editMode ? WEBHOOK_UPDATE_URL : WEBHOOK_URL;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      throw new Error('Submission failed');
    }

    const result = await response.json();

    // Show success modal
    document.getElementById('clientIdDisplay').textContent = result.clientId || editingClientId || 'ADP-XXX';
    document.getElementById('successModal').classList.add('active');

  } catch (error) {
    console.error('Submission error:', error);
    alert('Submission failed. Please try again or contact support.');
  } finally {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
  }
}

function collectFormData() {
  const form = document.getElementById('intakeForm');
  const formData = new FormData(form);

  // Basic fields
  const data = {
    timestamp: new Date().toISOString(),

    // Section 1: Business Info
    businessName: formData.get('businessName'),
    businessAddress: formData.get('businessAddress'),
    businessPhone: formData.get('businessPhone'),
    websiteUrl: formData.get('websiteUrl'),
    socialHandle: formData.get('socialHandle'),
    industry: formData.get('industry'),

    // Section 2: Platforms
    platforms: formData.getAll('platforms'),
    platformStatuses: {},
    platformEmail: formData.get('platformEmail'),
    platformNotes: formData.get('platformNotes'),

    // Section 3: Portal Access
    primaryContactName: formData.get('primaryContactName'),
    primaryContactEmail: formData.get('primaryContactEmail'),
    primaryContactPhone: formData.get('primaryContactPhone'),
    additionalUsers: [],

    // Section 4: Verification Docs
    ownerName: formData.get('ownerName'),
    businessLicenseUrl: uploadedFiles['businessLicense'] || '',
    ownerIdFrontUrl: uploadedFiles['ownerIdFront'] || '',
    ownerIdBackUrl: uploadedFiles['ownerIdBack'] || '',

    // Section 5: Brand Assets
    logoUrl: uploadedFiles['logo'] || '',
    brandColors: formData.get('brandColors'),
    tagline: formData.get('tagline'),
    exteriorPhotoUrl: uploadedFiles['exteriorPhoto'] || '',
    interiorPhotoUrl: uploadedFiles['interiorPhoto'] || '',
    otherPhotosUrls: uploadedFiles['otherPhotos'] || [],

    // Section 6: Avatar People
    avatarPeople: [],

    // Section 7: Plan & Pricing
    selectedPlan: formData.get('selectedPlan'),
    addons: formData.getAll('addons'),
    onboardingComplexity: formData.get('onboardingComplexity'),
    onboardingTotal: formData.get('onboardingTotal'),

    // Section 8: Notes
    meetingNotes: formData.get('meetingNotes'),
    followUpItems: formData.get('followUpItems'),
    redFlags: formData.get('redFlags')
  };

  // Add clientId if in edit mode
  if (editMode && editingClientId) {
    data.clientId = editingClientId;
  }

  // Collect platform statuses
  data.platforms.forEach(platform => {
    const key = `platformStatus_${platform.replace(/[^a-zA-Z]/g, '')}`;
    data.platformStatuses[platform] = formData.get(key);
  });

  // Collect additional users
  for (let i = 1; i <= portalUserCount; i++) {
    const name = formData.get(`additionalUserName_${i}`);
    const email = formData.get(`additionalUserEmail_${i}`);
    if (name || email) {
      data.additionalUsers.push({ name, email });
    }
  }

  // Collect avatar people
  for (let i = 0; i < avatarCount; i++) {
    const name = formData.get(`avatarName_${i}`);
    const email = formData.get(`avatarEmail_${i}`);
    const role = formData.get(`avatarRole_${i}`);
    const isPrimary = formData.get(`avatarPrimary_${i}`) === 'on';
    if (name || email || role) {
      data.avatarPeople.push({ name, email, role, isPrimary });
    }
  }

  return data;
}

function resetForm() {
  document.getElementById('successModal').classList.remove('active');
  resetFormState();

  // Go back to selector
  document.getElementById('intakeForm').style.display = 'none';
  document.getElementById('clientSelector').style.display = 'block';
  document.getElementById('clientDropdown').style.display = 'none';
}
