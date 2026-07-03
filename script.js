// DOM Elements
const header = document.getElementById('header');
const menuToggle = document.getElementById('menu-toggle');
const navLinks = document.querySelector('.nav-links');
const navItems = document.querySelectorAll('.nav-links a');

// Sticky Header on Scroll
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Mobile Menu Toggle
menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    
    // Toggle icon between bars and times
    const icon = menuToggle.querySelector('i');
    if (navLinks.classList.contains('active')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-xmark');
        menuToggle.style.color = 'var(--clr-text-main)'; // ensure visibility on white bg
    } else {
        icon.classList.remove('fa-xmark');
        icon.classList.add('fa-bars');
        // Reset color based on scroll position
        if (window.scrollY > 50) {
            menuToggle.style.color = 'var(--clr-primary)';
        } else {
            menuToggle.style.color = 'var(--clr-white)';
        }
    }
});

// Close Mobile Menu on Link Click
navItems.forEach(item => {
    item.addEventListener('click', () => {
        navLinks.classList.remove('active');
        const icon = menuToggle.querySelector('i');
        icon.classList.remove('fa-xmark');
        icon.classList.add('fa-bars');
    });
});

// Smooth Scroll for Anchor Links (already handled by CSS, but keeping this for fallback/customization)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        // Only prevent default if it's not just a "#" link
        if (this.getAttribute('href') !== '#') {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerHeight = header.offsetHeight;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
  
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        }
    });
});

// =========================================
// CUSTOMER REVIEWS LOGIC
// =========================================

const reviewForm = document.getElementById('review-form');
const reviewsList = document.getElementById('reviews-list');
const stars = document.querySelectorAll('.star-rating-input i');
const ratingInput = document.getElementById('reviewer-rating');

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCf_3l9cMLRzKQEUCSRwvNJB3gai87gGQY",
  authDomain: "okana-dimsum.firebaseapp.com",
  projectId: "okana-dimsum",
  storageBucket: "okana-dimsum.firebasestorage.app",
  messagingSenderId: "957816602769",
  appId: "1:957816602769:web:2f37b7be2a3b850c367f30"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const reviewsRef = database.ref('reviews');

// Interactive Star Rating
if (stars.length > 0) {
    stars.forEach(star => {
        // Hover effect
        star.addEventListener('mouseover', function() {
            const value = this.getAttribute('data-rating');
            stars.forEach(s => {
                s.classList.remove('hover');
                if (s.getAttribute('data-rating') <= value) {
                    s.classList.add('hover');
                }
            });
        });

        // Remove hover effect
        star.addEventListener('mouseout', function() {
            stars.forEach(s => s.classList.remove('hover'));
        });

        // Click to select rating
        star.addEventListener('click', function() {
            const value = this.getAttribute('data-rating');
            ratingInput.value = value;
            
            stars.forEach(s => {
                s.classList.remove('active');
                if (s.getAttribute('data-rating') <= value) {
                    s.classList.add('active');
                    s.classList.remove('fa-regular');
                    s.classList.add('fa-solid');
                } else {
                    s.classList.remove('fa-solid');
                    s.classList.add('fa-regular');
                }
            });
        });
    });
}

// Helper: Format Date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

// Fetch and Render Reviews from Firebase (Real-time listener)
reviewsRef.on('value', (snapshot) => {
    if (!reviewsList) return;
    reviewsList.innerHTML = '';
    
    const data = snapshot.val();
    const reviews = [];
    
    if (data) {
        for (let id in data) {
            reviews.push({ id, ...data[id] });
        }
    }
    
    // Sort from newest
    reviews.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (reviews.length === 0) {
        reviewsList.innerHTML = '<p class="text-center" style="grid-column: 1/-1;">Belum ada ulasan. Jadilah yang pertama!</p>';
        return;
    }

    reviews.forEach(review => {
        // Generate stars HTML
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= review.rating) {
                starsHtml += '<i class="fa-solid fa-star"></i>';
            } else {
                starsHtml += '<i class="fa-regular fa-star"></i>';
            }
        }
        
        // Generate Avatar initial
        const initial = review.name ? review.name.charAt(0).toUpperCase() : '?';

        const card = document.createElement('div');
        card.className = 'review-card';
        card.innerHTML = `
            <div class="review-header">
                <div class="reviewer-info">
                    <div class="reviewer-avatar">${initial}</div>
                    <div>
                        <div class="reviewer-name">${review.name}</div>
                        <div class="review-date">${formatDate(review.date)}</div>
                    </div>
                </div>
            </div>
            <div class="review-stars">
                ${starsHtml}
            </div>
            <div class="review-text">
                "${review.text}"
            </div>
        `;
        reviewsList.appendChild(card);
    });
});

// Initial set stars to 5 (default value)
if (stars.length > 0) {
    const defaultRating = ratingInput.value;
    stars.forEach(s => {
        if (s.getAttribute('data-rating') <= defaultRating) {
            s.classList.add('active', 'fa-solid');
            s.classList.remove('fa-regular');
        } else {
            s.classList.add('fa-regular');
            s.classList.remove('fa-solid');
        }
    });
}

// Handle Form Submit (Push to Firebase)
if (reviewForm) {
    reviewForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('reviewer-name').value.trim();
        const text = document.getElementById('reviewer-text').value.trim();
        const rating = parseInt(ratingInput.value);
        
        if (!name || !text) return;
        
        // Tampilkan loading state (opsional)
        const submitBtn = reviewForm.querySelector('.btn-submit-review');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = 'Mengirim...';
        submitBtn.disabled = true;
        
        const newReview = {
            name: name,
            rating: rating,
            text: text,
            date: new Date().toISOString()
        };
        
        // Push ke Firebase
        reviewsRef.push(newReview)
            .then(() => {
                // Reset form
                reviewForm.reset();
                ratingInput.value = 5;
                stars.forEach(s => {
                    s.classList.add('active', 'fa-solid');
                    s.classList.remove('fa-regular');
                });
                
                // Kembalikan tombol
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
                
                alert("Terima kasih! Ulasan Anda berhasil ditambahkan secara Real-time.");
            })
            .catch((error) => {
                console.error("Error writing new review to Firebase", error);
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
                alert("Gagal mengirim ulasan. Silakan coba lagi.");
            });
    });
}
