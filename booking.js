// Shri Ram Janki Sewa Trust - Smart Verification Booking Flow with Real QR Payment

window.BookingEngine = {
    room: null,
    guestType: 'Indian',
    checkIn: '',
    checkOut: '',
    nights: 1,
    guests: 2,
    paymentMethod: 'Pay at Trust Reception',
    guestDetails: {
        name: '',
        email: '',
        phone: '',
        country: '',
        idNumber: '',
        requests: ''
    }
};

const TRUST_UPI_ID = "99198857ankeshtiwri@okhdfcbank";
const TRUST_PAYEE_NAME = "Ankesh Tiwari";
const TRUST_QR_IMAGE = "/static/uploads/payment_qr.jpg";

function startBookingFlow(roomId) {
    const room = window.AppState.rooms.find(r => r.id === roomId);
    if (!room) {
        showNotification('Room details not available', 'error');
        return;
    }

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const defaultCheckIn = window.AppState.checkInDate || today.toISOString().split('T')[0];
    const defaultCheckOut = window.AppState.checkOutDate || tomorrow.toISOString().split('T')[0];

    window.BookingEngine = {
        room: room,
        guestType: window.AppState.guestType || 'Indian',
        checkIn: defaultCheckIn,
        checkOut: defaultCheckOut,
        nights: calculateNights(defaultCheckIn, defaultCheckOut),
        guests: 2,
        paymentMethod: 'Pay at Trust Reception',
        guestDetails: { name: '', email: '', phone: '', country: '', idNumber: '', requests: '' }
    };

    renderBookingModal();
    const modal = document.getElementById('booking-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function calculateNights(d1, d2) {
    try {
        const start = new Date(d1);
        const end = new Date(d2);
        const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : 1;
    } catch (e) {
        return 1;
    }
}

function calculateTotal() {
    const b = window.BookingEngine;
    const isNRI = b.guestType === 'NRI';
    const rate = isNRI ? b.room.price_nri : b.room.price_indian;
    const isDorm = b.room.category.toLowerCase().includes('dormitory');

    if (isDorm) {
        return rate * b.nights * Math.max(1, b.guests);
    } else {
        return rate * b.nights;
    }
}

function copyUPIId() {
    navigator.clipboard.writeText(TRUST_UPI_ID).then(() => {
        showNotification('UPI ID Copied to Clipboard!', 'success', TRUST_UPI_ID);
    }).catch(() => {
        prompt("Copy UPI ID:", TRUST_UPI_ID);
    });
}

function renderBookingModal() {
    const container = document.getElementById('booking-modal-content');
    if (!container) return;

    const b = window.BookingEngine;
    const room = b.room;
    const isNRI = b.guestType === 'NRI';
    const rate = isNRI ? room.price_nri : room.price_indian;
    const isDorm = room.category.toLowerCase().includes('dormitory');
    const total = calculateTotal();
    const isUPI = b.paymentMethod === 'UPI / QR Code';

    const upiLink = `upi://pay?pa=${TRUST_UPI_ID}&pn=${encodeURIComponent(TRUST_PAYEE_NAME)}&am=${total}&cu=INR`;

    container.innerHTML = `
        <div class="relative bg-white rounded-3xl overflow-hidden shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col border border-amber-200 text-xs">
            <div class="p-5 bg-slate-950 text-white flex items-center justify-between border-b border-amber-900/50 flex-shrink-0">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center text-lg font-bold">
                        <i class="fa-solid fa-om"></i>
                    </div>
                    <div>
                        <h3 class="font-serif-luxury font-bold text-base text-white">${room.name}</h3>
                        <p class="text-[11px] text-amber-200">Shri Ram Janki Sewa Trust • Ayodhya Dham</p>
                    </div>
                </div>
                <button onclick="closeModal('booking-modal')" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <form id="direct-booking-form" onsubmit="submitDirectBooking(event)" class="p-6 overflow-y-auto space-y-4 flex-1">
                
                <!-- Citizen Type Switcher -->
                <div class="p-3 bg-amber-50 rounded-2xl border border-amber-200 space-y-1.5">
                    <label class="block font-bold text-amber-950">Pilgrim Category (नागरिकता श्रेणी):</label>
                    <div class="grid grid-cols-2 gap-2">
                        <label class="p-2.5 bg-white rounded-xl border ${!isNRI ? 'border-amber-600 ring-2 ring-amber-500/20' : 'border-amber-200'} cursor-pointer flex items-center gap-2">
                            <input type="radio" name="modal_guest_type" value="Indian" ${!isNRI ? 'checked' : ''} onchange="updateBookingGuestType('Indian')">
                            <div>
                                <strong class="block text-stone-900 text-[11px]">Indian Citizen (भारतीय)</strong>
                                <span class="text-[10px] text-amber-700 font-bold">${formatCurrency(room.price_indian)}${isDorm ? '/bed' : '/nt'}</span>
                            </div>
                        </label>
                        <label class="p-2.5 bg-white rounded-xl border ${isNRI ? 'border-amber-600 ring-2 ring-amber-500/20' : 'border-amber-200'} cursor-pointer flex items-center gap-2">
                            <input type="radio" name="modal_guest_type" value="NRI" ${isNRI ? 'checked' : ''} onchange="updateBookingGuestType('NRI')">
                            <div>
                                <strong class="block text-stone-900 text-[11px]">NRI / Foreign Pilgrim (विदेशी)</strong>
                                <span class="text-[10px] text-amber-700 font-bold">${formatCurrency(room.price_nri)}${isDorm ? '/bed' : '/nt'}</span>
                            </div>
                        </label>
                    </div>
                </div>

                <!-- Stay Dates & Guests Count -->
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                        <label class="block font-semibold text-stone-700 mb-1">Check-in Date *</label>
                        <input type="date" id="b-checkin" value="${b.checkIn}" onchange="updateBDates()" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none" required>
                    </div>
                    <div>
                        <label class="block font-semibold text-stone-700 mb-1">Check-out Date *</label>
                        <input type="date" id="b-checkout" value="${b.checkOut}" onchange="updateBDates()" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none" required>
                    </div>
                    <div class="col-span-2 sm:col-span-1">
                        <label class="block font-semibold text-stone-700 mb-1">${isDorm ? 'Number of Beds *' : 'Devotees Count *'}</label>
                        <input type="number" id="b-guests" value="${b.guests}" min="1" max="${isDorm ? 15 : room.capacity}" onchange="updateBGuests(this.value)" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none" required>
                    </div>
                </div>

                <!-- Conditional ID & Details based on Indian vs NRI -->
                <div class="space-y-3 pt-2 border-t border-slate-100">
                    <div>
                        <label class="block font-semibold text-stone-700 mb-1">Full Name (As on Govt ID) *</label>
                        <input type="text" id="b-name" value="${b.guestDetails.name}" placeholder="e.g. Ramesh Sharma" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none" required>
                    </div>

                    ${!isNRI ? `
                        <!-- Indian Devotee Fields -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label class="block font-semibold text-stone-700 mb-1">Aadhaar Card Number * (12 Digits)</label>
                                <input type="text" id="b-idnumber" value="${b.guestDetails.idNumber}" placeholder="e.g. 5432 1098 7654" class="w-full px-3.5 py-2 bg-amber-50/60 border border-amber-300 rounded-xl outline-none font-mono" required>
                            </div>
                            <div>
                                <label class="block font-semibold text-stone-700 mb-1">Mobile WhatsApp Number *</label>
                                <input type="tel" id="b-phone" value="${b.guestDetails.phone}" placeholder="e.g. 98765 43210" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none" required>
                            </div>
                        </div>

                        <div>
                            <label class="block font-semibold text-stone-700 mb-1">Email Address *</label>
                            <input type="email" id="b-email" value="${b.guestDetails.email}" placeholder="ramesh@gmail.com" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none" required>
                        </div>
                    ` : `
                        <!-- NRI / Foreign Devotee Fields (NO mobile number required!) -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label class="block font-semibold text-stone-700 mb-1">Country of Origin / Residence *</label>
                                <input type="text" id="b-country" value="${b.guestDetails.country}" placeholder="e.g. USA, UK, Canada, Australia" class="w-full px-3.5 py-2 bg-blue-50/60 border border-blue-300 rounded-xl outline-none font-medium" required>
                            </div>
                            <div>
                                <label class="block font-semibold text-stone-700 mb-1">Passport / Foreign Govt ID No. *</label>
                                <input type="text" id="b-idnumber" value="${b.guestDetails.idNumber}" placeholder="e.g. P12345678" class="w-full px-3.5 py-2 bg-blue-50/60 border border-blue-300 rounded-xl outline-none font-mono" required>
                            </div>
                        </div>

                        <div>
                            <label class="block font-semibold text-stone-700 mb-1">Email Address (For Confirmation Voucher) *</label>
                            <input type="email" id="b-email" value="${b.guestDetails.email}" placeholder="your.name@example.com" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none" required>
                        </div>
                    `}

                    <div>
                        <label class="block font-semibold text-stone-700 mb-1">Special Notes / Arrival Time (Optional)</label>
                        <input type="text" id="b-requests" value="${b.guestDetails.requests}" placeholder="e.g., Senior citizen, ground floor room..." class="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none">
                    </div>
                </div>

                <!-- Payment Selection -->
                <div class="pt-2 border-t border-slate-100 space-y-2">
                    <label class="block font-bold text-stone-800">Select Payment Method (भुगतान विकल्प):</label>
                    <div class="grid grid-cols-2 gap-2 text-[11px]">
                        <label class="p-2.5 rounded-xl border ${isUPI ? 'border-amber-600 bg-amber-50/80 ring-2 ring-amber-500/20' : 'bg-slate-50 border-slate-200'} cursor-pointer flex items-center gap-2">
                            <input type="radio" name="modal_payment_method" value="UPI / QR Code" ${isUPI ? 'checked' : ''} onchange="updatePaymentMode('UPI / QR Code')">
                            <span class="font-bold text-stone-900"><i class="fa-solid fa-qrcode text-amber-600 mr-1"></i> UPI / QR Code (Instant)</span>
                        </label>
                        <label class="p-2.5 rounded-xl border ${!isUPI ? 'border-amber-600 bg-amber-50/80 ring-2 ring-amber-500/20' : 'bg-slate-50 border-slate-200'} cursor-pointer flex items-center gap-2">
                            <input type="radio" name="modal_payment_method" value="Pay at Trust Reception" ${!isUPI ? 'checked' : ''} onchange="updatePaymentMode('Pay at Trust Reception')">
                            <span class="font-bold text-stone-900"><i class="fa-solid fa-hand-holding-dollar text-amber-600 mr-1"></i> Pay at Reception</span>
                        </label>
                    </div>
                </div>

                <!-- Real User QR Code Box -->
                ${isUPI ? `
                    <div class="p-4 bg-gradient-to-br from-amber-50 via-white to-amber-100/60 rounded-3xl border-2 border-amber-400 space-y-3 text-center">
                        <div class="flex items-center justify-center gap-2 text-amber-950 font-bold text-xs">
                            <i class="fa-solid fa-mobile-screen-button text-amber-600"></i>
                            <span>Scan to Pay (Google Pay, PhonePe, Paytm, BHIM)</span>
                        </div>
                        
                        <!-- Real QR Image -->
                        <div class="w-56 h-64 mx-auto bg-white p-2 rounded-2xl shadow-lg border border-amber-300 flex flex-col items-center justify-center overflow-hidden">
                            <img src="${TRUST_QR_IMAGE}" alt="Ankesh Tiwari UPI QR Code" class="w-full h-full object-contain">
                        </div>

                        <div class="space-y-2 pt-1">
                            <div class="flex items-center justify-center gap-2 bg-white py-1.5 px-3 rounded-xl border border-amber-300 max-w-sm mx-auto shadow-sm">
                                <span class="text-[11px] text-stone-600">UPI ID:</span>
                                <strong class="text-stone-900 font-mono text-xs select-all">${TRUST_UPI_ID}</strong>
                                <button type="button" onclick="copyUPIId()" class="ml-1 p-1 px-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-bold text-[10px] transition-colors">
                                    <i class="fa-regular fa-copy mr-1"></i> Copy
                                </button>
                            </div>
                            
                            <div class="text-xs font-black text-amber-950 font-serif-luxury">
                                Account: <strong>${TRUST_PAYEE_NAME}</strong> • Exact Payable: <strong>${formatCurrency(total)}</strong>
                            </div>

                            <a href="${upiLink}" class="inline-block sm:hidden px-4 py-1.5 bg-blue-600 text-white font-bold rounded-xl text-xs shadow">
                                <i class="fa-solid fa-bolt mr-1"></i> Open in UPI App
                            </a>
                        </div>
                    </div>
                ` : ''}

                <!-- Price Summary -->
                <div class="p-3 bg-amber-50 rounded-xl border border-amber-200 flex justify-between items-center">
                    <div>
                        <span class="text-stone-500 block text-[10px]">Total: ${b.nights} Night(s) (${isNRI ? 'NRI Rate' : 'Indian Rate'})</span>
                        <strong class="text-stone-900 text-sm">Payable Amount:</strong>
                    </div>
                    <span class="text-xl font-black text-amber-900 font-serif-luxury">${formatCurrency(total)}</span>
                </div>

                <!-- Submit / Confirm Button -->
                <button type="submit" id="submit-booking-btn" class="kesariya-btn w-full py-3 text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-2">
                    <i class="fa-solid fa-circle-check"></i> ${isUPI ? `I Have Paid ${formatCurrency(total)} • Complete Booking` : `Confirm Booking (${formatCurrency(total)})`}
                </button>
            </form>
        </div>
    `;
}

function updatePaymentMode(mode) {
    window.BookingEngine.paymentMethod = mode;
    renderBookingModal();
}

function updateBookingGuestType(type) {
    window.BookingEngine.guestType = type;
    renderBookingModal();
}

function updateBDates() {
    const cin = document.getElementById('b-checkin').value;
    const cout = document.getElementById('b-checkout').value;
    if (cin && cout) {
        window.BookingEngine.checkIn = cin;
        window.BookingEngine.checkOut = cout;
        window.BookingEngine.nights = calculateNights(cin, cout);
        renderBookingModal();
    }
}

function updateBGuests(val) {
    window.BookingEngine.guests = parseInt(val) || 1;
    renderBookingModal();
}

async function submitDirectBooking(e) {
    e.preventDefault();
    const b = window.BookingEngine;
    const isNRI = b.guestType === 'NRI';

    const nameEl = document.getElementById('b-name');
    const emailEl = document.getElementById('b-email');
    const phoneEl = document.getElementById('b-phone');
    const countryEl = document.getElementById('b-country');
    const idNumEl = document.getElementById('b-idnumber');
    const reqEl = document.getElementById('b-requests');

    if (!nameEl || !nameEl.value.trim()) {
        showNotification('Please enter guest name', 'warning');
        return;
    }
    if (!emailEl || !emailEl.value.trim()) {
        showNotification('Please enter email address', 'warning');
        return;
    }

    if (!isNRI) {
        if (!idNumEl || !idNumEl.value.trim()) {
            showNotification('Please enter Aadhaar Card Number', 'warning');
            return;
        }
        if (!phoneEl || !phoneEl.value.trim()) {
            showNotification('Please enter Mobile Number', 'warning');
            return;
        }
    } else {
        if (!countryEl || !countryEl.value.trim()) {
            showNotification('Please enter Country of Origin', 'warning');
            return;
        }
        if (!idNumEl || !idNumEl.value.trim()) {
            showNotification('Please enter Passport / Foreign ID Number', 'warning');
            return;
        }
    }

    const btn = document.getElementById('submit-booking-btn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing & Verifying...';
    }

    const payload = {
        room_id: b.room.id,
        guest_type: b.guestType,
        guest_name: nameEl.value.trim(),
        guest_email: emailEl.value.trim(),
        guest_phone: phoneEl ? phoneEl.value.trim() : '',
        country_name: isNRI ? countryEl.value.trim() : 'India',
        id_proof_number: idNumEl ? idNumEl.value.trim() : '',
        check_in: b.checkIn,
        check_out: b.checkOut,
        guests_count: b.guests,
        payment_method: b.paymentMethod,
        special_requests: reqEl ? reqEl.value.trim() : ''
    };

    try {
        const res = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.success) {
            closeModal('booking-modal');
            
            if (window.confetti) {
                confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
            }

            if (window.Swal) {
                Swal.fire({
                    title: '🌸 Jai Shri Ram! Booking Confirmed',
                    html: `
                        <div class="text-xs space-y-2 text-stone-700 py-2">
                            <div class="p-3 bg-emerald-50 rounded-2xl border border-emerald-300 text-emerald-900 font-bold">
                                <i class="fa-solid fa-circle-check text-emerald-600 text-base mr-1"></i> Payment & Yatra Reservation Successful!
                            </div>
                            <p><strong>Booking Ref:</strong> ${data.booking_reference}</p>
                            <p><strong>Amount:</strong> ₹${Number(data.total_amount).toLocaleString('en-IN')}</p>
                            <p class="text-stone-500">Redirecting to your official Yatra Voucher & QR Code...</p>
                        </div>
                    `,
                    icon: 'success',
                    showConfirmButton: false,
                    timer: 2500
                }).then(() => {
                    window.location.href = data.redirect_url;
                });
            } else {
                window.location.href = data.redirect_url;
            }
        } else {
            showNotification(data.message, 'error');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = 'Confirm Booking';
            }
        }
    } catch (err) {
        showNotification('Error creating booking', 'error');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = 'Confirm Booking';
        }
    }
}
