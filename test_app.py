from app import app
from database import init_db
import json

init_db(force_reseed=True)
client = app.test_client()

# 1. Test Devotee Booking with Aadhaar Verification
res_ind = client.post('/api/bookings', json={
    'room_id': 1,
    'guest_name': 'Ramesh Chandra Sharma',
    'guest_email': 'ramesh@gmail.com',
    'guest_phone': '9876543210',
    'id_proof_number': '543210987654',
    'check_in': '2026-09-15',
    'check_out': '2026-09-17',
    'guests_count': 2,
    'payment_method': 'UPI / QR Code',
    'special_requests': 'Ground floor room'
})
assert res_ind.status_code == 201
data_ind = json.loads(res_ind.data)
assert data_ind['success'] is True
assert data_ind['payment_status'] == 'Paid'
print(f"[PASS] 1. Devotee Booking with Aadhaar Verified (Ref: {data_ind['booking_reference']}, Paid: Rs {data_ind['total_amount']})")

# 2. Test Admin Bookings API returns ID details
res_admin_b = client.get('/api/bookings')
assert res_admin_b.status_code == 200
data_admin_b = json.loads(res_admin_b.data)
assert len(data_admin_b['bookings']) >= 1
assert data_admin_b['bookings'][0]['id_proof_number'] == '543210987654'
print("[PASS] 2. Admin successfully retrieved Aadhaar details for bookings!")

# 3. Test Confirmation Voucher
res_v1 = client.get(f"/booking-confirmation/{data_ind['booking_reference']}")
assert res_v1.status_code == 200
assert b'543210987654' in res_v1.data
assert b'8303333309' in res_v1.data
print("[PASS] 3. Official Yatra Voucher verified with helpline 8303333309!")

# 4. Test Homepage contains Donation section and Shri Ram photo
res_home = client.get('/')
assert res_home.status_code == 200
assert b'donation-section' in res_home.data
assert b'shri_ram_ji.jpg' in res_home.data
assert b'8303333309' in res_home.data
print("[PASS] 4. Homepage verified with Donation section and Prabhu Shri Ram Ji portrait!")

print("\n*** ALL TESTS PASSED 100%! ***")
