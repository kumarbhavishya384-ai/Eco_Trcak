document.addEventListener('DOMContentLoaded', () => {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Elements
    const profileForm = document.getElementById('profileForm');
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const profilePicInput = document.getElementById('profilePicInput');
    const avatarPreviewImage = document.getElementById('avatarPreviewImage');
    const avatarPlaceholderInitial = document.getElementById('avatarPlaceholderInitial');
    const profileDisplayName = document.getElementById('profileDisplayName');
    const profileEmailDisplay = document.getElementById('profileEmailDisplay');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    
    let currentProfilePicBase64 = user.profilePic || null;

    // Populate Initial Data
    firstNameInput.value = user.firstName || '';
    lastNameInput.value = user.lastName || '';
    emailInput.value = user.email || '';
    phoneInput.value = user.phone || '';

    profileDisplayName.textContent = `${user.firstName} ${user.lastName || ''}`;
    profileEmailDisplay.textContent = user.email || '';
    
    const profileEcoScoreDisplay = document.getElementById('profileEcoScoreDisplay');
    if (profileEcoScoreDisplay) {
        profileEcoScoreDisplay.textContent = `EcoScore: ${user.ecoScore !== undefined ? user.ecoScore : '--'}`;
    }

    if (currentProfilePicBase64) {
        avatarPreviewImage.src = currentProfilePicBase64;
        avatarPreviewImage.style.display = 'block';
        avatarPlaceholderInitial.style.display = 'none';
    } else {
        avatarPlaceholderInitial.textContent = (user.firstName[0] + (user.lastName ? user.lastName[0] : '')).toUpperCase();
    }

    // Handle Image Selection
    profilePicInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (e.g. max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                showGlobalToast("Image is too large. Please select an image under 2MB.", "error");
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (event) => {
                currentProfilePicBase64 = event.target.result;
                avatarPreviewImage.src = currentProfilePicBase64;
                avatarPreviewImage.style.display = 'block';
                avatarPlaceholderInitial.style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    });

    // Handle Form Submission
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        saveProfileBtn.disabled = true;
        saveProfileBtn.textContent = 'Saving...';
        
        const payload = {
            firstName: firstNameInput.value.trim(),
            lastName: lastNameInput.value.trim(),
            phone: phoneInput.value.trim(),
            profilePic: currentProfilePicBase64
        };

        try {
            const result = await apiFetch('/auth/update-profile', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (result.success) {
                showGlobalToast("Profile updated successfully!");
                // Update local storage user
                if (result.user) {
                    // Retain token in local storage
                    result.user.token = user.token;
                    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(result.user));
                    
                    // Update UI across
                    populateSidebar(result.user);
                    profileDisplayName.textContent = `${result.user.firstName} ${result.user.lastName || ''}`;
                }
            } else {
                throw new Error(result.message || "Failed to update profile");
            }
        } catch (error) {
            console.error("Profile update error:", error);
            showGlobalToast(error.message, "error");
        } finally {
            saveProfileBtn.disabled = false;
            saveProfileBtn.textContent = 'Save Changes';
        }
    });
});
