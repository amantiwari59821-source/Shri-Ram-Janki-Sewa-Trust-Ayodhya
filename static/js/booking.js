// Shri Ram Janki Sewa Trust - Temple Inspired Verification Booking Flow with QR Payment

window.BookingEngine = {
    room: null,
    checkIn: '',
    checkOut: '',
    nights: 1,
    guests: 2,
    paymentMethod: 'Pay at Trust Reception',
    guestDetails: {
        name: '',
        email: '',
        phone: '',
        idNumber: '',
        requests: ''
    }
};

const TRUST_UPI_ID = "99198857ankeshtiwri@okhdfcbank";
const TRUST_PAYEE_NAME = "Ankesh Tiwari";
const TRUST_QR_IMAGE = "/static/images/cropped_payment_qr.jpg";

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
        checkIn: defaultCheckIn,
        checkOut: defaultCheckOut,
        nights: calculateNights(defaultCheckIn, defaultCheckOut),
        guests: 2,
        paymentMethod: 'Pay at Trust Reception',
        guestDetails: { name: '', email: '', phone: '', idNumber: '', requests: '' }
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
    const rate = b.room.price_indian;
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
    const rate = room.price_indian;
    const isDorm = room.category.toLowerCase().includes('dormitory');
    const total = calculateTotal();
    const isUPI = b.paymentMethod === 'UPI / QR Code';

    const upiLink = `upi://pay?pa=${TRUST_UPI_ID}&pn=${encodeURIComponent(TRUST_PAYEE_NAME)}&am=${total}&cu=INR`;

    container.innerHTML = `
        <div class="relative bg-[#fffaf1] rounded-3xl overflow-hidden shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col border border-[#d7a84f]/50 text-xs">
            <div class="p-5 bg-[#2a0611] text-white flex items-center justify-between border-b border-[#d7a84f]/30 flex-shrink-0">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-[#4b0718] border border-[#d7a84f]/40 text-[#f5d891] flex items-center justify-center text-lg font-bold">
                        <i class="fa-solid fa-om"></i>
                    </div>
                    <div>
                        <h3 class="font-serif-mandir font-bold text-base text-white">${room.name}</h3>
                        <p class="text-[11px] text-[#f5d891]">श्री राम जानकी सेवा ट्रस्ट • अयोध्या धाम</p>
                    </div>
                </div>
                <button onclick="closeModal('booking-modal')" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <form id="direct-booking-form" onsubmit="submitDirectBooking(event)" class="p-6 overflow-y-auto space-y-4 flex-1">
                
                <!-- Stay Dates & Guests Count -->
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                        <label class="block font-semibold text-stone-700 mb-1">Check-in Date *</label>
                        <input type="date" id="b-checkin" value="${b.checkIn}" onchange="updateBDates()" class="w-full px-3 py-2 bg-white border border-[#ead8b6] rounded-xl outline-none focus:border-[#d7a84f]" required>
                    </div>
                    <div>
                        <label class="block font-semibold text-stone-700 mb-1">Check-out Date *</label>
                        <input type="date" id="b-checkout" value="${b.checkOut}" onchange="updateBDates()" class="w-full px-3 py-2 bg-white border border-[#ead8b6] rounded-xl outline-none focus:border-[#d7a84f]" required>
                    </div>
                    <div class="col-span-2 sm:col-span-1">
                        <label class="block font-semibold text-stone-700 mb-1">${isDorm ? 'Number of Beds *' : 'Devotees Count *'}</label>
                        <input type="number" id="b-guests" value="${b.guests}" min="1" max="${isDorm ? 15 : room.capacity}" onchange="updateBGuests(this.value)" class="w-full px-3 py-2 bg-white border border-[#ead8b6] rounded-xl outline-none focus:border-[#d7a84f]" required>
                    </div>
                </div>

                <!-- Devotee Verification Details -->
                <div class="space-y-3 pt-2 border-t border-[#ead8b6]/60">
                    <div>
                        <label class="block font-semibold text-stone-700 mb-1">Full Name (सरकारी पहचान पत्र अनुसार) *</label>
                        <input type="text" id="b-name" value="${b.guestDetails.name}" placeholder="उदा. Ramesh Sharma" class="w-full px-3.5 py-2.5 bg-white border border-[#ead8b6] rounded-xl outline-none focus:border-[#d7a84f]" required>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="block font-semibold text-stone-700 mb-1">Aadhaar / Govt ID Number *</label>
                            <input type="text" id="b-idnumber" value="${b.guestDetails.idNumber}" placeholder="उदा. 5432 1098 7654" class="w-full px-3.5 py-2.5 bg-[#fff8eb] border border-[#d7a84f]/60 rounded-xl outline-none font-mono focus:border-[#d7a84f]" required>
                        </div>
                        <div>
                            <label class="block font-semibold text-stone-700 mb-1">Mobile WhatsApp Number *</label>
                            <input type="tel" id="b-phone" value="${b.guestDetails.phone}" placeholder="उदा. 98765 43210" class="w-full px-3.5 py-2.5 bg-white border border-[#ead8b6] rounded-xl outline-none focus:border-[#d7a84f]" required>
                        </div>
                    </div>

                    <div>
                        <label class="block font-semibold text-stone-700 mb-1">Email Address (फॉर वाउचर एवं रसीद) *</label>
                        <input type="email" id="b-email" value="${b.guestDetails.email}" placeholder="ramesh@gmail.com" class="w-full px-3.5 py-2.5 bg-white border border-[#ead8b6] rounded-xl outline-none focus:border-[#d7a84f]" required>
                    </div>

                    <div>
                        <label class="block font-semibold text-stone-700 mb-1">Special Notes / Arrival Time (ऐच्छिक)</label>
                        <input type="text" id="b-requests" value="${b.guestDetails.requests}" placeholder="उदा., वरिष्ठ नागरिक, ग्राउंड फ्लोर कमरा..." class="w-full px-3.5 py-2.5 bg-white border border-[#ead8b6] rounded-xl outline-none focus:border-[#d7a84f]">
                    </div>
                </div>

                <!-- Payment Selection -->
                <div class="pt-2 border-t border-[#ead8b6]/60 space-y-2">
                    <label class="block font-bold text-[#2a0611]">Select Payment Method (भुगतान विकल्प):</label>
                    <div class="grid grid-cols-2 gap-2 text-[11px]">
                        <label class="p-3 rounded-xl border ${isUPI ? 'border-[#d7a84f] bg-[#fff8eb] ring-2 ring-[#d7a84f]/30' : 'bg-white border-[#ead8b6]'} cursor-pointer flex items-center gap-2">
                            <input type="radio" name="modal_payment_method" value="UPI / QR Code" ${isUPI ? 'checked' : ''} onchange="updatePaymentMode('UPI / QR Code')">
                            <span class="font-bold text-[#2a0611]"><i class="fa-solid fa-qrcode text-[#7d1128] mr-1"></i> UPI / QR Code</span>
                        </label>
                        <label class="p-3 rounded-xl border ${!isUPI ? 'border-[#d7a84f] bg-[#fff8eb] ring-2 ring-[#d7a84f]/30' : 'bg-white border-[#ead8b6]'} cursor-pointer flex items-center gap-2">
                            <input type="radio" name="modal_payment_method" value="Pay at Trust Reception" ${!isUPI ? 'checked' : ''} onchange="updatePaymentMode('Pay at Trust Reception')">
                            <span class="font-bold text-[#2a0611]"><i class="fa-solid fa-hand-holding-dollar text-[#7d1128] mr-1"></i> Pay at Reception</span>
                        </label>
                    </div>
                </div>

                <!-- Real User QR Code Box -->
                ${isUPI ? `
                    <div class="p-4 bg-gradient-to-br from-[#fff8eb] via-white to-[#fff3d8] rounded-3xl border-2 border-[#d7a84f] space-y-3 text-center shadow-sm">
                        <div class="flex items-center justify-center gap-2 text-[#7d1128] font-bold text-xs">
                            <i class="fa-solid fa-mobile-screen-button text-[#d7a84f]"></i>
                            <span>Scan with Any UPI App (Google Pay, PhonePe, Paytm, BHIM)</span>
                        </div>
                        
                        <!-- Compact QR Box -->
                        <div class="w-44 h-44 mx-auto bg-white p-2 rounded-2xl shadow-md border border-[#d7a84f]/50 flex flex-col items-center justify-center overflow-hidden">
                            <img src="${TRUST_QR_IMAGE}" alt="Ankesh Tiwari UPI QR Code" class="w-full h-full object-contain">
                        </div>

                        <div class="space-y-2 pt-1">
                            <div class="flex items-center justify-center gap-2 bg-white py-1.5 px-3 rounded-xl border border-[#d7a84f]/50 max-w-sm mx-auto shadow-sm">
                                <span class="text-[11px] text-stone-600">UPI ID:</span>
                                <strong class="text-stone-900 font-mono text-xs select-all">${TRUST_UPI_ID}</strong>
                                <button type="button" onclick="copyUPIId()" class="ml-1 p-1 px-2 bg-[#fff8eb] hover:bg-[#ffeec7] text-[#7d1128] border border-[#d7a84f]/40 rounded font-bold text-[10px] transition-colors">
                                    <i class="fa-regular fa-copy mr-1"></i> Copy
                                </button>
                            </div>
                            
                            <div class="text-xs font-bold text-[#2a0611]">
                                Payee: <strong>${TRUST_PAYEE_NAME}</strong> • Total Payable: <strong class="text-[#7d1128]">${formatCurrency(total)}</strong>
                            </div>

                            <a href="${upiLink}" class="inline-block sm:hidden px-4 py-1.5 bg-blue-600 text-white font-bold rounded-xl text-xs shadow">
                                <i class="fa-solid fa-bolt mr-1"></i> Open in UPI App
                            </a>
                        </div>
                    </div>
                ` : ''}

                <!-- Price Summary -->
                <div class="p-3.5 bg-[#fff8eb] rounded-2xl border border-[#ead8b6] flex justify-between items-center">
                    <div>
                        <span class="text-stone-500 block text-[10px]">Total Stay: ${b.nights} Night(s)</span>
                        <strong class="text-[#2a0611] text-xs">Total Amount (कुल राशि):</strong>
                    </div>
                    <span class="text-xl font-bold text-[#7d1128] font-cinzel">${formatCurrency(total)}</span>
                </div>

                <!-- Submit / Confirm Button -->
                <button type="submit" id="submit-booking-btn" class="mandir-btn-maroon w-full py-3 text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-2">
                    <i class="fa-solid fa-circle-check"></i> ${isUPI ? `I Have Paid ${formatCurrency(total)} • Confirm Booking` : `Confirm Booking (${formatCurrency(total)})`}
                </button>
            </form>
        </div>
    `;
}

function updatePaymentMode(mode) {
    window.BookingEngine.paymentMethod = mode;
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

    const nameEl = document.getElementById('b-name');
    const emailEl = document.getElementById('b-email');
    const phoneEl = document.getElementById('b-phone');
    const idNumEl = document.getElementById('b-idnumber');
    const reqEl = document.getElementById('b-requests');

    if (!nameEl || !nameEl.value.trim()) {
        showNotification('कृपया अतिथि का नाम दर्ज करें', 'warning');
        return;
    }
    if (!emailEl || !emailEl.value.trim()) {
        showNotification('कृपया ईमेल आईडी दर्ज करें', 'warning');
        return;
    }
    if (!idNumEl || !idNumEl.value.trim()) {
        showNotification('कृपया आधार / सरकारी पहचान पत्र संख्या दर्ज करें', 'warning');
        return;
    }
    if (!phoneEl || !phoneEl.value.trim()) {
        showNotification('कृपया मोबाइल व्हाट्सएप नंबर दर्ज करें', 'warning');
        return;
    }

    const btn = document.getElementById('submit-booking-btn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> बुकिंग एवं सत्यापन जारी है...';
    }

    const payload = {
        room_id: b.room.id,
        guest_type: 'Indian',
        guest_name: nameEl.value.trim(),
        guest_email: emailEl.value.trim(),
        guest_phone: phoneEl.value.trim(),
        country_name: 'India',
        id_proof_number: idNumEl.value.trim(),
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
                    title: '🌸 जय श्री राम! कमरा बुक हो गया',
                    html: `
                        <div class="text-xs space-y-2 text-stone-700 py-2">
                            <div class="p-3 bg-emerald-50 rounded-2xl border border-emerald-300 text-emerald-900 font-bold">
                                <i class="fa-solid fa-circle-check text-emerald-600 text-base mr-1"></i> यात्रा कक्ष आरक्षण सफल रहा!
                            </div>
                            <p><strong>Booking Ref:</strong> ${data.booking_reference}</p>
                            <p><strong>कुल राशि:</strong> ₹${Number(data.total_amount).toLocaleString('en-IN')}</p>
                            <p class="text-stone-500">आपके आधिकारिक यात्रा वाउचर एवं क्यूआर रसीद पर ले जाया जा रहा है...</p>
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
        showNotification('बुकिंग में त्रुटि हुई', 'error');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = 'Confirm Booking';
        }
    }
}
