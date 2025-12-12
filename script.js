// =========================================
//  1. Firebase Config & Init
// =========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, set, push, onValue, update } 
    from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCvI2p17gPgP6XEvVa2bMcz_tttE3CTJMg",
  authDomain: "physics-no-4.firebaseapp.com",
  projectId: "physics-no-4",
  storageBucket: "physics-no-4.firebasestorage.app",
  messagingSenderId: "821368960392",
  appId: "1:821368960392:web:0328b3bb2abf8c58df363d"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// =========================================
//  2. Global Variables & State
// =========================================
let currentUser = null; // سيتم تعبئته بعد تسجيل الدخول
const SUPER_ADMIN_USER = "BIMBO";
const SUPER_ADMIN_PASS = "2052006";

// =========================================
//  3. Intro Sequence (Error -> Welcome -> App)
// =========================================
window.onload = function() {
    // 1. عرض شاشة الخطأ
    setTimeout(() => {
        document.getElementById('fake-error-screen').classList.add('hidden');
        document.getElementById('welcome-message').classList.remove('hidden');
        
        // 2. عرض رسالة الترحيب
        setTimeout(() => {
            document.getElementById('welcome-message').classList.add('hidden');
            document.getElementById('main-app').classList.remove('hidden');
            
            // فتح نافذة تسجيل الدخول مباشرة بعد الدخول
            document.getElementById('login-modal').classList.remove('hidden');
        }, 3000); // مدة رسالة الترحيب
        
    }, 3000); // مدة شاشة الخطأ
};

// =========================================
//  4. Auth & Permissions Logic
// =========================================
const loginBtn = document.getElementById('login-btn');

loginBtn.addEventListener('click', () => {
    const userIn = document.getElementById('login-username').value;
    const passIn = document.getElementById('login-password').value;

    if(userIn === SUPER_ADMIN_USER && passIn === SUPER_ADMIN_PASS) {
        currentUser = {
            name: "BIMBO (Super Admin)",
            role: "super_admin",
            verified: true
        };
        setupUIForUser();
        document.getElementById('login-modal').classList.add('hidden');
    } else {
        // محاكاة دخول مستخدم عادي أو أدمن عادي (للاختبار)
        if(userIn !== "") {
             currentUser = {
                name: userIn,
                role: "user", // أو admin لو عندك أدمنز تانيين
                verified: false
            };
            setupUIForUser();
            document.getElementById('login-modal').classList.add('hidden');
        } else {
            alert("يرجى إدخال البيانات!");
        }
    }
});

function setupUIForUser() {
    const displayUser = document.getElementById('display-username');
    const badge = document.getElementById('verified-badge');
    const adminControls = document.getElementById('admin-controls');
    const footerEditBtn = document.getElementById('edit-footer-btn');

    displayUser.innerText = currentUser.name;

    // توثيق السوبر أدمن
    if (currentUser.role === "super_admin") {
        badge.classList.remove('hidden'); // إظهار أيقونة التوثيق
        adminControls.classList.remove('hidden'); // إظهار زر الإضافة
        footerEditBtn.classList.remove('hidden'); // إظهار زر تعديل الفوتر
    } else {
        badge.classList.add('hidden');
        adminControls.classList.add('hidden');
        footerEditBtn.classList.add('hidden');
    }
}

// =========================================
//  5. Navigation Logic
// =========================================
const deptTrigger = document.getElementById('dept-trigger');
const deptList = document.getElementById('dept-list');
const homeSection = document.getElementById('home-section');
const prepSection = document.getElementById('prep-section');
const aboutBtn = document.getElementById('about-btn');
const aboutContent = document.getElementById('about-content');

// Dropdown Toggle
deptTrigger.addEventListener('click', () => {
    deptList.classList.toggle('hidden');
});

// About Toggle
aboutBtn.addEventListener('click', () => {
    aboutContent.classList.toggle('hidden');
});

// Navigation Function
window.navigateTo = function(page) {
    if (page === 'prep') {
        homeSection.classList.remove('active-section');
        homeSection.classList.add('hidden-section');
        
        prepSection.classList.remove('hidden-section');
        prepSection.classList.add('active-section');
        
        // تحميل البوستات عند فتح القسم
        loadPosts();
    } else if (page === 'home') {
        prepSection.classList.remove('active-section');
        prepSection.classList.add('hidden-section');
        
        homeSection.classList.remove('hidden-section');
        homeSection.classList.add('active-section');
    }
    deptList.classList.add('hidden'); // إخفاء القائمة بعد الاختيار
};

// =========================================
//  6. Content Management (Add/Read)
// =========================================
const uploadModal = document.getElementById('upload-modal');
const addContentBtn = document.getElementById('add-content-btn');
const uploadForm = document.getElementById('upload-form');
let currentUploadType = '';

addContentBtn.addEventListener('click', () => {
    uploadModal.classList.remove('hidden');
});

window.closeUploadModal = function() {
    uploadModal.classList.add('hidden');
    uploadForm.classList.add('hidden');
};

window.selectUploadType = function(type) {
    currentUploadType = type;
    uploadForm.classList.remove('hidden');
    // يمكنك تغيير الحقول بناءً على النوع هنا إذا أردت
};

document.getElementById('submit-upload-btn').addEventListener('click', () => {
    const title = document.getElementById('content-title').value;
    const desc = document.getElementById('content-desc').value;
    
    if(!title) { alert("أدخل العنوان على الأقل"); return; }

    const newPost = {
        title: title,
        desc: desc,
        type: currentUploadType,
        author: currentUser.name,
        timestamp: Date.now(),
        dateStr: new Date().toLocaleString('ar-EG')
    };

    // إرسال للفاير بيز (Node: prep_posts)
    const postsRef = ref(db, 'prep_posts');
    push(postsRef, newPost)
    .then(() => {
        alert("تم النشر بنجاح!");
        closeUploadModal();
        // تصفية الحقول
        document.getElementById('content-title').value = '';
        document.getElementById('content-desc').value = '';
    })
    .catch((error) => {
        alert("خطأ: " + error.message);
    });
});

// قراءة البوستات وعرضها
function loadPosts() {
    const postsContainer = document.getElementById('content-feed');
    const postsRef = ref(db, 'prep_posts');

    onValue(postsRef, (snapshot) => {
        postsContainer.innerHTML = ''; // مسح القديم
        const data = snapshot.val();
        
        if(data) {
            // تحويل الكائن إلى مصفوفة لعكس الترتيب (الأحدث فوق)
            const postsArray = Object.values(data).reverse();
            
            postsArray.forEach(post => {
                let iconClass = 'fa-file';
                if(post.type === 'video') iconClass = 'fa-video';
                if(post.type === 'folder') iconClass = 'fa-folder';
                if(post.type === 'post') iconClass = 'fa-pen';

                const html = `
                    <div class="post-card">
                        <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                            <div style="background:#eee; padding:10px; border-radius:50%;">
                                <i class="fa-solid ${iconClass}" style="color:var(--accent-color);"></i>
                            </div>
                            <h3 style="margin:0;">${post.title}</h3>
                        </div>
                        <p>${post.desc}</p>
                        
                        <div style="margin-top:15px; border-top:1px solid #eee; padding-top:10px;">
                            <button style="background:none; border:none; color:#555; cursor:pointer;">
                                <i class="fa-solid fa-share-nodes"></i> مشاركة
                            </button>
                        </div>

                        <div class="post-meta">
                            <span>بواسطة: ${post.author}</span>
                            <span>${post.dateStr}</span>
                        </div>
                    </div>
                `;
                postsContainer.innerHTML += html;
            });
        } else {
            postsContainer.innerHTML = '<p style="text-align:center; color:#777;">لا يوجد محتوى حالياً.</p>';
        }
    });
}

// =========================================
//  7. Theme Toggle
// =========================================
const themeBtn = document.getElementById('theme-toggle');
let isDark = false;

themeBtn.addEventListener('click', () => {
    isDark = !isDark;
    if(isDark) {
        document.body.setAttribute('data-theme', 'dark');
        themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
        document.body.removeAttribute('data-theme');
        themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
});
