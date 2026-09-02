// Shri Ram Janki Sewa Trust, Ayodhya Dham - Main JavaScript

window.AppState = {
    rooms: [],
    selectedRoom: null,
    guestType: 'Indian', // 'Indian' or 'NRI'
    checkInDate: '',
    checkOutDate: '',
    guests: 1,
    isPlayingAudio: false
};

let ambientAudio = null;

function toggleDevotionalAudio() {
    const icon = document.getElementById('audio-icon');
    const text = document.getElementById('audio-text');

    if (!ambientAudio) {
        ambientAudio = new Audio('https://cdn.pixabay.com/download/audio/2022/05/16/audio_c899c75467.mp3?filename=meditation-flute-112190.mp3');
        ambientAudio.loop = true;
        ambientAudio.volume = 0.45;
    }

    if (window.AppState.isPlayingAudio) {
        ambientAudio.pause();
        window.AppState.isPlayingAudio = false;
        if (icon) icon.className = 'fa-solid fa-volume-xmark';
        if (text) text.innerText = 'Play Bhajan Flute';
        showNotification('Divine Music Paused', 'info');
    } else {
        ambientAudio.play().then(() => {
            window.AppState.isPlayingAudio = true;
            if (icon) icon.className = 'fa-solid fa-volume-high text-amber-300 animate-pulse';
            if (text) text.innerText = 'Now Playing Flute';
            showNotification('🌸 Playing Divine Temple Flute', 'success');
        }).catch(() => {
            showNotification('Click anywhere to enable audio playback', 'warning');
        });
    }
}

function setGuestType(type) {
    window.AppState.guestType = type;
    
    const indBtn = document.getElementById('btn-indian-guest');
    const nriBtn = document.getElementById('btn-nri-guest');

    if (type === 'Indian') {
        if (indBtn) indBtn.className = 'px-5 py-2.5 bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5';
        if (nriBtn) nriBtn.className = 'px-5 py-2.5 bg-white text-stone-700 hover:bg-amber-50 font-semibold text-xs rounded-xl border border-amber-200 transition-all flex items-center gap-1.5';
    } else {
        if (nriBtn) nriBtn.className = 'px-5 py-2.5 bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5';
        if (indBtn) indBtn.className = 'px-5 py-2.5 bg-white text-stone-700 hover:bg-amber-50 font-semibold text-xs rounded-xl border border-amber-200 transition-all flex items-center gap-1.5';
    }

    loadRooms();
}

function formatCurrency(amount) {
    return '₹' + Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function showNotification(title, icon = 'success', text = '') {
    if (window.Swal) {
        Swal.fire({
            title: title,
            text: text,
            icon: icon,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    } else {
        alert(title + (text ? '\n' + text : ''));
    }
}

function initDates() {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const checkInInput = document.getElementById('search-checkin');
    const checkOutInput = document.getElementById('search-checkout');
    
    if (checkInInput && checkOutInput) {
        const todayStr = today.toISOString().split('T')[0];
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        checkInInput.min = todayStr;
        checkInInput.value = todayStr;
        checkOutInput.min = tomorrowStr;
        checkOutInput.value = tomorrowStr;

        window.AppState.checkInDate = todayStr;
        window.AppState.checkOutDate = tomorrowStr;

        checkInInput.addEventListener('change', (e) => {
            window.AppState.checkInDate = e.target.value;
            const nextDay = new Date(e.target.value);
            nextDay.setDate(nextDay.getDate() + 1);
            checkOutInput.min = nextDay.toISOString().split('T')[0];
            if (checkOutInput.value <= e.target.value) {
                checkOutInput.value = nextDay.toISOString().split('T')[0];
                window.AppState.checkOutDate = checkOutInput.value;
            }
        });

        checkOutInput.addEventListener('change', (e) => {
            window.AppState.checkOutDate = e.target.value;
        });
    }
}

async function loadRooms() {
    const roomContainer = document.getElementById('rooms-grid');
    if (!roomContainer) return;

    try {
        const res = await fetch(`/api/rooms?guest_type=${window.AppState.guestType}`);
        const data = await res.json();

        if (data.success) {
            window.AppState.rooms = data.rooms;
            renderRooms(data.rooms);
            updateQuickPriceCards(data.rooms);
        }
    } catch (err) {
        console.error(err);
        roomContainer.innerHTML = '<div class="col-span-full text-center text-red-500 py-8">Unable to load rooms. Please check connection.</div>';
    }
}

function updateQuickPriceCards(rooms) {
    const container = document.getElementById('quick-price-summary');
    if (!container) return;

    container.innerHTML = rooms.map((r, i) => `
        <div class="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between">
            <div>
                <strong class="text-stone-900 block font-bold text-sm">${i+1}. ${r.name}</strong>
                <span class="text-stone-500 text-[11px]">${r.bed_type}</span>
            </div>
            <div class="text-right">
                <div class="font-bold text-amber-900 text-base font-serif-luxury">${formatCurrency(r.price_indian)} <span class="text-[10px] text-stone-500 font-normal">/ nt (Ind)</span></div>
                <div class="text-[11px] text-stone-600 font-serif-luxury">${formatCurrency(r.price_nri)} <span class="text-[10px] text-stone-400">/ nt (NRI)</span></div>
            </div>
        </div>
    `).join('');
}

function renderRooms(rooms) {
    const container = document.getElementById('rooms-grid');
    if (!container) return;

    const isNRI = window.AppState.guestType === 'NRI';

    container.innerHTML = rooms.map(room => {
        const coverImg = room.images && room.images.length > 0 ? room.images[0] : '/static/uploads/hotel_photo_0d4190c33a.jpeg';
        const price = isNRI ? room.price_nri : room.price_indian;
        const isDorm = room.category.toLowerCase().includes('dormitory');
        const priceSuffix = isDorm ? '/ bed / night' : '/ room / night';

        return `
            <div class="room-card bg-white rounded-3xl overflow-hidden border border-amber-200 shadow-md flex flex-col justify-between group">
                <div>
                    <div class="relative h-64 overflow-hidden bg-slate-100 cursor-pointer" onclick="openRoomDetailsModal(${room.id})">
                        <img src="${coverImg}" alt="${room.name}" class="w-full h-full object-cover room-card-img-zoom" loading="lazy" onerror="this.src='/static/uploads/hotel_photo_0d4190c33a.jpeg'">
                        
                        <div class="absolute top-4 left-4">
                            <span class="px-3.5 py-1.5 bg-slate-950/85 backdrop-blur-md text-amber-300 text-xs font-bold rounded-full tracking-wider border border-amber-500/30">
                                ${room.name}
                            </span>
                        </div>

                        <div class="absolute bottom-3 left-4 right-4 flex justify-between items-center text-xs text-white">
                            <span class="bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-amber-400/30 font-semibold">
                                <i class="fa-solid fa-gopuram text-amber-400 mr-1"></i> 1.4 km to Ram Mandir
                            </span>
                            <span class="bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-amber-400/30 font-semibold">
                                <i class="fa-solid fa-bed text-amber-400 mr-1"></i> ${room.capacity} ${isDorm ? 'Beds' : 'Guests'}
                            </span>
                        </div>
                    </div>

                    <div class="p-6">
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="text-xl font-bold font-serif-luxury text-stone-900 group-hover:text-amber-700 transition-colors cursor-pointer" onclick="openRoomDetailsModal(${room.id})">
                                ${room.name}
                            </h3>
                            <span class="text-xs text-amber-800 font-mono bg-amber-50 px-2 py-0.5 rounded border border-amber-200">#${room.room_number}</span>
                        </div>

                        <p class="text-stone-600 text-xs leading-relaxed mb-4">
                            ${room.description}
                        </p>

                        <div class="flex flex-wrap gap-1.5 mb-2">
                            ${(room.amenities || []).map(a => `
                                <span class="px-2.5 py-1 bg-amber-50 text-amber-900 text-xs rounded-lg flex items-center gap-1 border border-amber-200/60 font-medium">
                                    <i class="fa-solid fa-check text-xs text-emerald-600"></i> ${a}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="px-6 pb-6 pt-3 bg-amber-50/50 border-t border-amber-100 flex items-center justify-between">
                    <div>
                        <span class="text-[11px] text-stone-500 block font-medium">
                            ${isNRI ? 'NRI / Foreign Rate' : 'Indian Devotee Rate'}
                        </span>
                        <div class="flex items-baseline gap-1">
                            <span class="text-2xl font-black text-amber-900 font-serif-luxury">${formatCurrency(price)}</span>
                            <span class="text-[11px] text-stone-500">${priceSuffix}</span>
                        </div>
                    </div>

                    <div class="flex items-center gap-2">
                        <button onclick="openRoomDetailsModal(${room.id})" class="p-2.5 border border-amber-300 text-amber-900 hover:text-white rounded-xl hover:bg-amber-600 transition-all text-xs font-semibold bg-white" title="View Photos & Details">
                            <i class="fa-solid fa-images"></i>
                        </button>
                        <button onclick="startBookingFlow(${room.id})" class="kesariya-btn px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md">
                            <i class="fa-solid fa-calendar-check"></i> Book Now
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function openRoomDetailsModal(roomId) {
    const room = window.AppState.rooms.find(r => r.id === roomId);
    if (!room) return;

    window.AppState.selectedRoom = room;
    const modal = document.getElementById('room-detail-modal');
    const content = document.getElementById('room-detail-content');
    if (!modal || !content) return;

    const isNRI = window.AppState.guestType === 'NRI';
    const price = isNRI ? room.price_nri : room.price_indian;
    const isDorm = room.category.toLowerCase().includes('dormitory');
    const images = room.images && room.images.length > 0 ? room.images : ['/static/uploads/hotel_photo_0d4190c33a.jpeg'];

    content.innerHTML = `
        <div class="relative bg-white rounded-3xl overflow-hidden shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-amber-200">
            <div class="relative h-80 bg-slate-900 flex-shrink-0">
                <img id="modal-main-img" src="${images[0]}" alt="${room.name}" class="w-full h-full object-cover transition-opacity duration-300" onerror="this.src='/static/uploads/hotel_photo_0d4190c33a.jpeg'">
                
                <button onclick="closeModal('room-detail-modal')" class="absolute top-4 right-4 w-10 h-10 bg-black/60 hover:bg-black text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors z-20">
                    <i class="fa-solid fa-xmark text-lg"></i>
                </button>

                <div class="absolute bottom-4 left-4 right-4 flex gap-2 overflow-x-auto p-2 bg-black/50 backdrop-blur-md rounded-2xl">
                    ${images.map((img) => `
                        <img src="${img}" onclick="document.getElementById('modal-main-img').src='${img}'" class="w-16 h-12 object-cover rounded-lg cursor-pointer border-2 hover:border-amber-400 transition-all flex-shrink-0" alt="Thumbnail">
                    `).join('')}
                </div>

                <div class="absolute top-4 left-4">
                    <span class="px-3.5 py-1 bg-amber-600 text-white text-xs font-bold rounded-full">
                        ${room.name}
                    </span>
                </div>
            </div>

            <div class="p-6 md:p-8 overflow-y-auto space-y-6">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-100 pb-4">
                    <div>
                        <h2 class="text-2xl font-bold font-serif-luxury text-stone-900">${room.name}</h2>
                        <span class="text-xs text-amber-700 font-semibold"><i class="fa-solid fa-gopuram mr-1"></i> Located 1.4 km from Shri Ram Janmabhoomi Mandir</span>
                    </div>
                    <div class="text-right">
                        <span class="text-xs text-stone-400 block">${isNRI ? 'NRI Devotee Rate' : 'Indian Devotee Rate'}</span>
                        <span class="text-2xl font-black text-amber-900 font-serif-luxury">${formatCurrency(price)}</span>
                        <span class="text-xs text-stone-500">${isDorm ? '/ bed' : '/ night'}</span>
                    </div>
                </div>

                <div>
                    <h4 class="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">Room Details</h4>
                    <p class="text-stone-600 text-xs leading-relaxed">${room.description}</p>
                </div>

                <div>
                    <h4 class="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">Room Inclusions</h4>
                    <div class="grid grid-cols-2 gap-2">
                        ${(room.amenities || []).map(a => `
                            <div class="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/60 text-stone-800 text-xs font-medium">
                                <i class="fa-solid fa-check text-emerald-600"></i>
                                <span>${a}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div class="p-5 bg-amber-50/40 border-t border-amber-100 flex items-center justify-between flex-shrink-0">
                <button onclick="closeModal('room-detail-modal')" class="px-5 py-2.5 bg-slate-200 text-stone-700 font-semibold text-xs rounded-xl">Close</button>
                <button onclick="closeModal('room-detail-modal'); startBookingFlow(${room.id});" class="kesariya-btn px-6 py-2.5 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md">
                    <i class="fa-solid fa-calendar-check"></i> Book this Room
                </button>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function openMyBookingsModal() {
    const modal = document.getElementById('my-bookings-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

async function handleBookingLookup(e) {
    if (e) e.preventDefault();
    const query = document.getElementById('lookup-query').value.trim();
    const resultsContainer = document.getElementById('lookup-results');

    if (!query) {
        showNotification('Please enter Booking Reference ID or Email', 'warning');
        return;
    }

    resultsContainer.innerHTML = '<p class="text-center text-xs text-amber-800 py-4"><i class="fa-solid fa-spinner fa-spin"></i> Searching reservation...</p>';

    try {
        const res = await fetch(`/api/bookings/${encodeURIComponent(query)}`);
        const data = await res.json();

        if (data.success && data.bookings.length > 0) {
            resultsContainer.innerHTML = data.bookings.map(b => `
                <div class="p-4 bg-white rounded-2xl border border-amber-200 shadow-sm space-y-2 text-xs">
                    <div class="flex justify-between items-center border-b border-amber-100 pb-2">
                        <span class="font-mono font-bold text-amber-900">${b.booking_reference}</span>
                        <span class="px-2 py-0.5 rounded text-[11px] font-bold ${b.booking_status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}">${b.booking_status}</span>
                    </div>
                    <div class="grid grid-cols-2 gap-2 text-stone-700">
                        <div><strong>Yatri:</strong> ${b.guest_name}</div>
                        <div><strong>Room:</strong> ${b.room_name}</div>
                        <div><strong>Dates:</strong> ${formatDate(b.check_in)} to ${formatDate(b.check_out)}</div>
                        <div><strong>Total Paid:</strong> ${formatCurrency(b.total_amount)}</div>
                    </div>
                    <div class="pt-2 flex justify-between items-center border-t border-amber-50">
                        <a href="/booking-confirmation/${b.booking_reference}" target="_blank" class="text-amber-700 font-bold hover:underline">
                            <i class="fa-solid fa-file-invoice"></i> View Voucher
                        </a>
                    </div>
                </div>
            `).join('');
        } else {
            resultsContainer.innerHTML = '<p class="text-center text-xs text-stone-500 py-4">No reservation found. Please check Booking ID.</p>';
        }
    } catch (err) {
        resultsContainer.innerHTML = '<p class="text-center text-xs text-red-500 py-4">Error looking up booking.</p>';
    }
}

async function handleContactForm(e) {
    if (e) e.preventDefault();
    const form = e.target;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    const message = form.message.value.trim();

    if (!name || !email || !message) {
        showNotification('Please fill required fields', 'warning');
        return;
    }

    try {
        const res = await fetch('/api/inquiries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, subject: 'Yatra Inquiry', message })
        });
        const data = await res.json();
        if (data.success) {
            showNotification('Jai Shri Ram! Message sent.', 'success');
            form.reset();
        }
    } catch (err) {
        showNotification('Failed to send message', 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initDates();
    loadRooms();

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-backdrop')) {
            e.target.classList.add('hidden');
            e.target.classList.remove('flex');
        }
    });
});
