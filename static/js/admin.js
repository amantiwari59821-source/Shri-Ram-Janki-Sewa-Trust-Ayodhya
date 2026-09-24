// Shri Ram Janki Sewa Trust - Admin JS with Rate Controller & Image Upload

window.AdminState = {
    activeTab: 'overview',
    stats: null,
    rooms: [],
    bookings: [],
    inquiries: [],
    bookingFilter: 'All',
    bookingSearch: ''
};

document.addEventListener('DOMContentLoaded', () => {
    loadAdminStats();
    loadAdminRooms();
    loadAdminBookings();
    loadAdminInquiries();
});

function switchAdminTab(tabId) {
    window.AdminState.activeTab = tabId;
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        if (btn.dataset.tab === tabId) {
            btn.classList.add('bg-amber-600', 'text-white', 'shadow');
            btn.classList.remove('text-slate-400', 'hover:text-white', 'hover:bg-slate-800');
        } else {
            btn.classList.remove('bg-amber-600', 'text-white', 'shadow');
            btn.classList.add('text-slate-400', 'hover:text-white', 'hover:bg-slate-800');
        }
    });

    document.querySelectorAll('.admin-tab-content').forEach(content => {
        if (content.id === `tab-${tabId}`) {
            content.classList.remove('hidden');
        } else {
            content.classList.add('hidden');
        }
    });
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

async function loadAdminStats() {
    try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        if (data.success) {
            const s = data.stats;
            window.AdminState.stats = s;

            const revEl = document.getElementById('kpi-revenue');
            const bookEl = document.getElementById('kpi-bookings');
            const occEl = document.getElementById('kpi-occupancy');
            const availEl = document.getElementById('kpi-available');

            if (revEl) revEl.innerText = formatCurrency(s.total_revenue);
            if (bookEl) bookEl.innerText = s.total_bookings;
            if (occEl) occEl.innerText = `${s.occupancy_rate}%`;
            if (availEl) availEl.innerText = `${s.available_rooms} / ${s.total_rooms}`;
        }
    } catch (err) {
        console.error('Error loading admin stats:', err);
    }
}

async function loadAdminRooms() {
    const tbody = document.getElementById('admin-rooms-tbody');
    if (!tbody) return;

    try {
        const res = await fetch('/api/rooms');
        const data = await res.json();
        if (data.success) {
            window.AdminState.rooms = data.rooms;
            renderAdminRoomsTable(data.rooms);
        }
    } catch (err) {
        console.error(err);
    }
}

function renderAdminRoomsTable(rooms) {
    const tbody = document.getElementById('admin-rooms-tbody');
    if (!tbody) return;

    tbody.innerHTML = rooms.map(r => `
        <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors text-xs text-stone-900">
            <td class="py-4 px-4 font-mono font-bold text-amber-900">#${r.room_number}</td>
            <td class="py-4 px-4 font-bold text-stone-900">${r.name}</td>
            <td class="py-4 px-4">
                <div class="flex items-center gap-1">
                    <span>₹</span>
                    <input type="number" value="${r.price_indian}" onchange="saveRoomPrice(${r.id}, 'price_indian', this.value)" class="w-24 px-2 py-1 bg-amber-50 border border-amber-300 rounded font-bold text-amber-950 outline-none" title="Change Indian Rate">
                </div>
            </td>
            <td class="py-4 px-4">
                <div class="flex items-center gap-1">
                    <span>₹</span>
                    <input type="number" value="${r.price_nri}" onchange="saveRoomPrice(${r.id}, 'price_nri', this.value)" class="w-24 px-2 py-1 bg-blue-50 border border-blue-300 rounded font-bold text-blue-950 outline-none" title="Change NRI Rate">
                </div>
            </td>
            <td class="py-4 px-4">
                <select onchange="updateRoomStatus(${r.id}, this.value)" class="px-2.5 py-1 text-xs font-bold rounded-lg border outline-none ${
                    r.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-rose-50 text-rose-700 border-rose-300'
                }">
                    <option value="Available" ${r.status === 'Available' ? 'selected' : ''}>Available</option>
                    <option value="Occupied" ${r.status === 'Occupied' ? 'selected' : ''}>Occupied</option>
                    <option value="Maintenance" ${r.status === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
                </select>
            </td>
            <td class="py-4 px-4 text-right">
                <button onclick="openEditRoomModal(${r.id})" class="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-lg" title="Edit Photos & Inclusions">
                    <i class="fa-solid fa-images"></i> Manage Photos
                </button>
            </td>
        </tr>
    `).join('');
}

async function saveRoomPrice(roomId, fieldName, newVal) {
    const payload = {};
    payload[fieldName] = parseFloat(newVal);

    try {
        const res = await fetch(`/api/rooms/${roomId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            showNotification('Room rate updated live!', 'success');
        } else {
            showNotification(data.message, 'error');
        }
    } catch (err) {
        showNotification('Error updating price', 'error');
    }
}

async function updateRoomStatus(roomId, newStatus) {
    try {
        const res = await fetch(`/api/rooms/${roomId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        const data = await res.json();
        if (data.success) {
            showNotification(`Status updated to ${newStatus}`, 'success');
            loadAdminStats();
        }
    } catch (err) {
        showNotification('Error updating status', 'error');
    }
}

async function handleImageUpload(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const formData = new FormData();
    formData.append('image', file);

    const preview = document.getElementById('uploaded-photo-preview');
    if (preview) preview.innerHTML = '<span class="text-xs text-amber-400"><i class="fa-solid fa-spinner fa-spin"></i> Uploading photo...</span>';

    try {
        const res = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (data.success) {
            showNotification('Photo Uploaded Successfully!', 'success');
            if (preview) {
                preview.innerHTML = `
                    <div class="flex items-center gap-3 mt-3 p-3 bg-slate-900 rounded-2xl border border-amber-500/40 text-left">
                        <img src="${data.image_url}" class="w-16 h-16 rounded-xl object-cover border border-amber-400">
                        <div class="text-[11px] text-amber-200">
                            <strong class="text-white">Photo Ready:</strong> ${data.filename}<br>
                            <span class="text-slate-400 font-mono select-all">${data.image_url}</span>
                        </div>
                    </div>
                `;
            }
            loadAdminRooms();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (err) {
        showNotification('Error uploading photo', 'error');
    }
}

function openEditRoomModal(roomId) {
    const room = window.AdminState.rooms.find(r => r.id === roomId);
    if (!room) return;

    const modal = document.getElementById('edit-room-modal');
    const form = document.getElementById('edit-room-form');
    if (!modal || !form) return;

    form.room_id.value = room.id;
    form.name.value = room.name;
    form.price_indian.value = room.price_indian;
    form.price_nri.value = room.price_nri;
    form.images.value = (room.images || []).join(', ');

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

async function handleEditRoomSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const roomId = form.room_id.value;
    const images = form.images.value.split(',').map(s => s.trim()).filter(s => s.length > 0);

    const payload = {
        name: form.name.value.trim(),
        price_indian: parseFloat(form.price_indian.value),
        price_nri: parseFloat(form.price_nri.value),
        images: images
    };

    try {
        const res = await fetch(`/api/rooms/${roomId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            showNotification('Room details & photos updated!', 'success');
            closeModal('edit-room-modal');
            loadAdminRooms();
        }
    } catch (err) {
        showNotification('Error updating room', 'error');
    }
}

async function loadAdminBookings() {
    const tbody = document.getElementById('admin-bookings-tbody');
    if (!tbody) return;

    try {
        let url = `/api/bookings?status=${window.AdminState.bookingFilter}`;
        if (window.AdminState.bookingSearch) url += `&search=${encodeURIComponent(window.AdminState.bookingSearch)}`;

        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
            window.AdminState.bookings = data.bookings;
            renderAdminBookingsTable(data.bookings);
        }
    } catch (err) {
        console.error(err);
    }
}

function renderAdminBookingsTable(bookings) {
    const tbody = document.getElementById('admin-bookings-tbody');
    if (!tbody) return;

    if (bookings.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-10 text-slate-400">No active bookings yet. New customer bookings will appear here instantly!</td></tr>`;
        return;
    }

    tbody.innerHTML = bookings.map(b => {
        const isIndian = b.guest_type === 'Indian';
        return `
            <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors text-xs text-stone-900">
                <td class="py-4 px-4 font-mono font-bold text-amber-900">${b.booking_reference}</td>
                <td class="py-4 px-4">
                    <strong class="text-stone-900">${b.guest_name}</strong>
                    <span class="block text-[11px] text-stone-500">${b.guest_email} ${b.guest_phone ? '• ' + b.guest_phone : ''}</span>
                </td>
                <td class="py-4 px-4">
                    ${isIndian ? `
                        <span class="px-2 py-0.5 bg-amber-100 text-amber-900 font-bold rounded text-[10px]">Aadhaar:</span>
                        <strong class="font-mono text-stone-800 text-[11px] block mt-0.5">${b.id_proof_number || 'N/A'}</strong>
                    ` : `
                        <span class="px-2 py-0.5 bg-blue-100 text-blue-900 font-bold rounded text-[10px]">${b.country_name || 'NRI'}</span>
                        <strong class="font-mono text-stone-800 text-[11px] block mt-0.5">Passport: ${b.id_proof_number || 'N/A'}</strong>
                    `}
                </td>
                <td class="py-4 px-4">
                    <span>${b.room_name}</span>
                    <span class="block text-[11px] text-amber-700 font-bold">${b.guest_type} Rate</span>
                </td>
                <td class="py-4 px-4">${formatDate(b.check_in)} to ${formatDate(b.check_out)} (${b.total_nights} nts)</td>
                <td class="py-4 px-4">
                    <div class="font-bold text-stone-900 font-serif-luxury">${formatCurrency(b.total_amount)}</div>
                    <span class="text-[10px] font-bold ${b.payment_status === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}">${b.payment_method} (${b.payment_status})</span>
                </td>
                <td class="py-4 px-4">
                    <select onchange="updateBookingStatus(${b.id}, this.value)" class="px-2 py-1 text-xs font-bold rounded-lg border outline-none ${
                        b.booking_status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-700'
                    }">
                        <option value="Confirmed" ${b.booking_status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                        <option value="Checked-in" ${b.booking_status === 'Checked-in' ? 'selected' : ''}>Checked-in</option>
                        <option value="Checked-out" ${b.booking_status === 'Checked-out' ? 'selected' : ''}>Checked-out</option>
                        <option value="Cancelled" ${b.booking_status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
                <td class="py-4 px-4 text-right">
                    <a href="/booking-confirmation/${b.booking_reference}" target="_blank" class="p-1.5 text-stone-700 hover:text-stone-900 bg-amber-100 hover:bg-amber-200 rounded-lg inline-block" title="Print Invoice">
                        <i class="fa-solid fa-print"></i>
                    </a>
                </td>
            </tr>
        `;
    }).join('');
}

async function updateBookingStatus(bookingId, newStatus) {
    try {
        const res = await fetch(`/api/bookings/${bookingId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        const data = await res.json();
        if (data.success) {
            showNotification(`Booking updated to ${newStatus}`, 'success');
            loadAdminStats();
            loadAdminBookings();
        }
    } catch (err) {
        showNotification('Error updating status', 'error');
    }
}

async function loadAdminInquiries() {
    const container = document.getElementById('admin-inquiries-list');
    if (!container) return;

    try {
        const res = await fetch('/api/inquiries');
        const data = await res.json();
        if (data.success) {
            if (data.inquiries.length === 0) {
                container.innerHTML = '<div class="p-8 text-center text-slate-400">No inquiries yet.</div>';
                return;
            }
            container.innerHTML = data.inquiries.map(inq => `
                <div class="p-4 bg-white rounded-2xl border border-slate-200 space-y-1 text-xs text-stone-800">
                    <div class="flex justify-between font-bold">
                        <span>${inq.name} (${inq.phone || inq.email})</span>
                        <span class="text-stone-400 text-[10px]">${inq.created_at || ''}</span>
                    </div>
                    <p class="text-stone-600">${inq.message}</p>
                </div>
            `).join('');
        }
    } catch (err) {
        console.error(err);
    }
}
