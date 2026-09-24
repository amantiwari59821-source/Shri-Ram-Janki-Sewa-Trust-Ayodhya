// Shri Ram Janki Sewa Trust - Temple Inspired Dynamic Interface

window.AppState = {
    guestType: 'Indian',
    rooms: [],
    selectedRoom: null,
    audioPlaying: false
};

const bgAudio = new Audio('https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=temple-flute-meditation-112194.mp3');
bgAudio.loop = true;

document.addEventListener('DOMContentLoaded', () => {
    fetchRooms();
});

function toggleDevotionalAudio() {
    const icon = document.getElementById('audio-icon');
    const text = document.getElementById('audio-text');
    if (!window.AppState.audioPlaying) {
        bgAudio.play().then(() => {
            window.AppState.audioPlaying = true;
            if (icon) icon.className = 'fa-solid fa-volume-high text-[#d7a84f] animate-pulse';
            if (text) text.innerText = 'Playing Flute';
            showNotification('Divine Temple Flute Playing 🌸', 'success');
        }).catch(() => {
            showNotification('Click anywhere to enable temple audio', 'info');
        });
    } else {
        bgAudio.pause();
        window.AppState.audioPlaying = false;
        if (icon) icon.className = 'fa-solid fa-music text-[#d7a84f]';
        if (text) text.innerText = 'Divine Flute';
    }
}

function setGuestType(type) {
    window.AppState.guestType = type;
    const btnInd = document.getElementById('btn-indian-guest');
    const btnNri = document.getElementById('btn-nri-guest');

    if (type === 'Indian') {
        if (btnInd) btnInd.className = 'px-5 py-2.5 bg-[#4b0718] text-[#f5d891] font-bold text-xs rounded-xl shadow-md border border-[#d7a84f] transition-all flex items-center gap-1.5';
        if (btnNri) btnNri.className = 'px-5 py-2.5 bg-white text-[#4b0718] hover:bg-[#fff8eb] font-semibold text-xs rounded-xl border border-[#ead8b6] transition-all flex items-center gap-1.5';
    } else {
        if (btnNri) btnNri.className = 'px-5 py-2.5 bg-[#4b0718] text-[#f5d891] font-bold text-xs rounded-xl shadow-md border border-[#d7a84f] transition-all flex items-center gap-1.5';
        if (btnInd) btnInd.className = 'px-5 py-2.5 bg-white text-[#4b0718] hover:bg-[#fff8eb] font-semibold text-xs rounded-xl border border-[#ead8b6] transition-all flex items-center gap-1.5';
    }

    renderRooms();
}

function formatCurrency(amount) {
    return '₹' + Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

async function fetchRooms() {
    try {
        const res = await fetch(`/api/rooms?guest_type=${window.AppState.guestType}`);
        const data = await res.json();
        if (data.success) {
            window.AppState.rooms = data.rooms;
            renderRooms();
        }
    } catch (err) {
        console.error('Error fetching rooms:', err);
    }
}

function renderRooms() {
    const grid = document.getElementById('rooms-grid');
    const summary = document.getElementById('quick-price-summary');
    const isNRI = window.AppState.guestType === 'NRI';

    if (summary) {
        summary.innerHTML = window.AppState.rooms.map(r => {
            const price = isNRI ? r.price_nri : r.price_indian;
            const isDorm = r.category.toLowerCase().includes('dormitory');
            return `
                <div class="p-4 bg-white rounded-2xl border border-[#d7a84f]/35 shadow-sm flex items-center justify-between">
                    <div>
                        <span class="text-[11px] font-bold text-[#7d1128] block">${r.category}</span>
                        <strong class="text-sm font-serif-mandir text-[#2a0611]">${r.name.split('(')[0]}</strong>
                    </div>
                    <div class="text-right">
                        <span class="text-xs font-bold text-[#7d1128] font-cinzel text-base">${formatCurrency(price)}</span>
                        <span class="text-[10px] text-stone-500 block">${isDorm ? '/bed/night' : '/night'}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    if (grid) {
        grid.innerHTML = window.AppState.rooms.map((r, idx) => {
            const price = isNRI ? r.price_nri : r.price_indian;
            const isDorm = r.category.toLowerCase().includes('dormitory');
            const mainImg = (r.images && r.images.length > 0) ? r.images[0] : '/static/uploads/hotel_photo_0d4190c33a.jpeg';

            return `
                <div class="mandir-card overflow-hidden flex flex-col group">
                    <!-- Image Showcase -->
                    <div class="relative h-60 overflow-hidden bg-slate-900">
                        <img src="${mainImg}" alt="${r.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                        <div class="absolute inset-0 bg-gradient-to-t from-[#180209] via-transparent to-black/30"></div>
                        
                        <!-- Top Badges -->
                        <div class="absolute top-3.5 left-3.5 right-3.5 flex justify-between items-center">
                            <span class="px-3 py-1 bg-[#2a0611]/85 text-[#f5d891] border border-[#d7a84f]/40 backdrop-blur-md rounded-full text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                                <i class="fa-solid fa-om text-[#d7a84f]"></i> ${r.category}
                            </span>
                            <span class="px-2.5 py-1 bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 backdrop-blur-md rounded-full text-[10px] font-bold flex items-center gap-1">
                                <i class="fa-solid fa-circle-check"></i> ${r.status}
                            </span>
                        </div>

                        <!-- Bottom Image Info -->
                        <div class="absolute bottom-3 left-3.5 right-3.5 flex justify-between items-end text-white">
                            <div>
                                <span class="text-[11px] text-[#f5d891] flex items-center gap-1 font-medium">
                                    <i class="fa-solid fa-location-dot text-[#d7a84f]"></i> ${r.view_type}
                                </span>
                            </div>
                            <div class="text-right">
                                <div class="text-[10px] text-stone-300 uppercase tracking-wider">${isNRI ? 'NRI Pilgrim Rate' : 'Indian Devotee Rate'}</div>
                                <div class="text-xl font-bold text-[#f5d891] font-cinzel">${formatCurrency(price)}<span class="text-xs font-normal text-stone-200">${isDorm ? '/bed' : '/nt'}</span></div>
                            </div>
                        </div>
                    </div>

                    <!-- Room Content -->
                    <div class="p-6 flex-1 flex flex-col justify-between space-y-4">
                        <div class="space-y-2">
                            <div class="flex justify-between items-start">
                                <h3 class="font-serif-mandir font-bold text-lg text-[#2a0611] leading-snug">${r.name}</h3>
                            </div>
                            <p class="text-xs text-stone-600 line-clamp-2 leading-relaxed font-light">${r.description}</p>
                            
                            <!-- Capacity & Bed -->
                            <div class="flex items-center gap-4 py-2 border-y border-[#ead8b6]/60 text-[11px] text-stone-700">
                                <span class="flex items-center gap-1.5"><i class="fa-solid fa-user-group text-[#b7812d]"></i> ${isDorm ? 'Hall Bedding' : 'Max ' + r.capacity + ' Guests'}</span>
                                <span>•</span>
                                <span class="flex items-center gap-1.5"><i class="fa-solid fa-bed text-[#b7812d]"></i> ${r.bed_type}</span>
                            </div>

                            <!-- Inclusions / Amenities chips -->
                            <div class="flex flex-wrap gap-1.5 pt-1">
                                ${(r.amenities || []).slice(0, 4).map(a => `
                                    <span class="px-2.5 py-1 bg-[#fff8eb] text-[#7d1128] border border-[#ead8b6] rounded-lg text-[10px] font-semibold flex items-center gap-1">
                                        <i class="fa-solid fa-check text-[#b7812d] text-[9px]"></i> ${a}
                                    </span>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="pt-2 flex gap-2">
                            <button onclick="openRoomDetailModal(${r.id})" class="px-3.5 py-2.5 bg-[#fff8eb] hover:bg-[#fff3d8] text-[#4b0718] border border-[#d7a84f]/40 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1 flex-1">
                                <i class="fa-solid fa-circle-info text-[#b7812d]"></i> Details
                            </button>
                            <button onclick="startBookingFlow(${r.id})" class="mandir-btn-gold px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 flex-[1.4]">
                                <i class="fa-solid fa-bolt"></i> Book Now
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

function openRoomDetailModal(roomId) {
    const room = window.AppState.rooms.find(r => r.id === roomId);
    if (!room) return;

    const modal = document.getElementById('room-detail-modal');
    const container = document.getElementById('room-detail-content');
    if (!modal || !container) return;

    const isNRI = window.AppState.guestType === 'NRI';
    const price = isNRI ? room.price_nri : room.price_indian;
    const isDorm = room.category.toLowerCase().includes('dormitory');

    container.innerHTML = `
        <div class="relative bg-[#fffaf1] rounded-3xl overflow-hidden shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-[#d7a84f]/50 text-xs">
            <div class="p-5 bg-[#2a0611] text-white flex items-center justify-between border-b border-[#d7a84f]/30 flex-shrink-0">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-[#4b0718] border border-[#d7a84f]/40 text-[#f5d891] flex items-center justify-center text-lg font-bold">
                        <i class="fa-solid fa-om"></i>
                    </div>
                    <div>
                        <h3 class="font-serif-mandir font-bold text-base text-white">${room.name}</h3>
                        <p class="text-[11px] text-[#f5d891]">Near Shri Ram Janmabhoomi (1.4 km) • Ayodhya Dham</p>
                    </div>
                </div>
                <button onclick="closeModal('room-detail-modal')" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <div class="p-6 overflow-y-auto space-y-4 flex-1">
                <!-- Gallery -->
                <div class="grid grid-cols-3 gap-2 rounded-2xl overflow-hidden">
                    ${(room.images || []).map(img => `
                        <div class="h-28 bg-slate-900 rounded-xl overflow-hidden border border-[#ead8b6]">
                            <img src="${img}" class="w-full h-full object-cover hover:scale-105 transition-transform duration-300">
                        </div>
                    `).join('')}
                </div>

                <div class="p-4 bg-white rounded-2xl border border-[#ead8b6] space-y-2">
                    <h4 class="font-bold text-[#4b0718] uppercase tracking-wider text-[10px]">Room Description</h4>
                    <p class="text-stone-700 leading-relaxed text-xs">${room.description}</p>
                </div>

                <div class="grid grid-cols-2 gap-3 text-xs">
                    <div class="p-3.5 bg-white rounded-xl border border-[#ead8b6] space-y-1">
                        <span class="text-stone-400 block text-[10px]">Bed & Arrangement</span>
                        <strong class="text-[#2a0611]">${room.bed_type}</strong>
                    </div>
                    <div class="p-3.5 bg-white rounded-xl border border-[#ead8b6] space-y-1">
                        <span class="text-stone-400 block text-[10px]">Ayodhya Mandir Distance</span>
                        <strong class="text-[#7d1128] font-bold">1.4 km from Ram Janmabhoomi</strong>
                    </div>
                </div>

                <div class="p-4 bg-white rounded-2xl border border-[#ead8b6] space-y-2">
                    <h4 class="font-bold text-[#4b0718] uppercase tracking-wider text-[10px]">Included Amenities</h4>
                    <div class="grid grid-cols-2 gap-2 text-[11px] text-stone-700">
                        ${(room.amenities || []).map(a => `
                            <div class="flex items-center gap-2">
                                <i class="fa-solid fa-circle-check text-[#b7812d]"></i>
                                <span>${a}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div class="p-4 bg-[#fff8eb] border-t border-[#ead8b6] flex justify-between items-center flex-shrink-0">
                <div>
                    <span class="text-[10px] text-stone-500 block uppercase">${isNRI ? 'NRI Rate' : 'Indian Devotee Rate'}</span>
                    <strong class="text-xl font-bold text-[#7d1128] font-cinzel">${formatCurrency(price)}</strong>
                    <span class="text-xs text-stone-500">${isDorm ? '/bed' : '/night'}</span>
                </div>
                <button onclick="closeModal('room-detail-modal'); startBookingFlow(${room.id});" class="mandir-btn-gold px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2">
                    <i class="fa-solid fa-calendar-check"></i> Book Room
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

async function handleBookingLookup(e) {
    e.preventDefault();
    const query = document.getElementById('lookup-query').value.trim();
    const resultsContainer = document.getElementById('lookup-results');
    if (!query || !resultsContainer) return;

    resultsContainer.innerHTML = '<div class="p-4 text-center text-xs text-[#7d1128]"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Searching Trust Database...</div>';

    try {
        const res = await fetch(`/api/bookings/${encodeURIComponent(query)}`);
        const data = await res.json();

        if (data.success && data.bookings.length > 0) {
            resultsContainer.innerHTML = data.bookings.map(b => `
                <div class="p-4 bg-white rounded-2xl border border-[#d7a84f]/40 shadow-sm space-y-2 text-xs text-stone-800">
                    <div class="flex justify-between items-center border-b border-[#ead8b6]/60 pb-2">
                        <strong class="font-mono text-sm text-[#7d1128]">${b.booking_reference}</strong>
                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${b.booking_status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-stone-100'}">${b.booking_status}</span>
                    </div>
                    <div class="grid grid-cols-2 gap-2 text-[11px]">
                        <div><strong>Yatri:</strong> ${b.guest_name}</div>
                        <div><strong>Room:</strong> ${b.room_name}</div>
                        <div><strong>Check-in:</strong> ${b.check_in}</div>
                        <div><strong>Check-out:</strong> ${b.check_out}</div>
                        <div><strong>Payment:</strong> ${b.payment_status}</div>
                        <div><strong>Amount:</strong> ${formatCurrency(b.total_amount)}</div>
                    </div>
                    <div class="pt-2 text-right">
                        <a href="/booking-confirmation/${b.booking_reference}" target="_blank" class="mandir-btn-maroon px-4 py-1.5 rounded-lg font-bold text-[11px] inline-flex items-center gap-1.5">
                            <i class="fa-solid fa-print"></i> View & Print Voucher
                        </a>
                    </div>
                </div>
            `).join('');
        } else {
            resultsContainer.innerHTML = '<div class="p-4 text-center text-xs text-rose-700 bg-rose-50 rounded-xl border border-rose-200">No booking found. Please check your Reference ID or Email.</div>';
        }
    } catch (err) {
        resultsContainer.innerHTML = '<div class="p-4 text-center text-xs text-rose-700">Error fetching booking details.</div>';
    }
}

function openMyBookingsModal() {
    const modal = document.getElementById('my-bookings-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

async function handleContactForm(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    const message = form.message.value.trim();

    try {
        const res = await fetch('/api/inquiries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, message })
        });
        const data = await res.json();
        if (data.success) {
            showNotification('Jai Shri Ram! Message received. Our sewa desk will call you.', 'success');
            form.reset();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (err) {
        showNotification('Error sending message', 'error');
    }
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
            timer: 3500,
            timerProgressBar: true
        });
    } else {
        alert(title + (text ? '\n' + text : ''));
    }
}
