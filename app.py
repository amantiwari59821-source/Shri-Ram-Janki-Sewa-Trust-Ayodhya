import os
import json
import random
import string
import uuid
from datetime import datetime, date
from flask import Flask, render_template, request, jsonify, redirect, url_for
from werkzeug.utils import secure_filename
from database import get_db, init_db

import jinja2

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_DIR = os.path.join(BASE_DIR, 'templates')
STATIC_DIR = os.path.join(BASE_DIR, 'static')

app = Flask(__name__, template_folder=TEMPLATE_DIR, static_folder=STATIC_DIR)

# Multi-path Jinja loader: checks templates/ subfolder, root directory, and Linux deploy paths
app.jinja_loader = jinja2.ChoiceLoader([
    jinja2.FileSystemLoader(TEMPLATE_DIR),
    jinja2.FileSystemLoader(BASE_DIR),
    jinja2.FileSystemLoader('/opt/render/project/src/templates'),
    jinja2.FileSystemLoader('/opt/render/project/src'),
])
app.config['SECRET_KEY'] = 'shri-ram-janki-sewa-trust-ayodhya-2026'
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'gif'}

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Ensure database and tables exist on server startup
init_db()

TRUST_INFO = {
    'name': 'श्री राम जानकी सेवा ट्रस्ट (Shri Ram Janki Sewa Trust)',
    'location': 'Near Shri Ram Janmabhoomi Complex, Ramkot, Ayodhya Dham, Uttar Pradesh - 224123',
    'phone': '8303333310',
    'email': 'shriramjankisewa@gmail.com',
    'ram_mandir_distance': '1.4 km',
    'upi_id': '99198857ankeshtiwri@okhdfcbank',
    'aarti_timings': [
        {'name': 'Mangala Aarti', 'time': '04:30 AM', 'significance': 'Early morning awakening of Ram Lalla', 'icon': 'fa-sun'},
        {'name': 'Shringar / Bhog Aarti', 'time': '06:30 AM & 12:00 PM', 'significance': 'Royal adornment & Rajbhog offering', 'icon': 'fa-crown'},
        {'name': 'Sandhya Aarti', 'time': '07:30 PM', 'significance': 'Evening illumination with Vedic chants', 'icon': 'fa-fire-flame-curved'},
        {'name': 'Shayan Aarti', 'time': '10:00 PM', 'significance': 'Night resting ceremony of Bhagwan', 'icon': 'fa-moon'}
    ],
    'key_distances': [
        {'place': 'Shri Ram Janmabhoomi Mandir', 'distance': '1.4 km', 'time': '5 min', 'icon': 'fa-gopuram'},
        {'place': 'Hanuman Garhi Mandir', 'distance': '1.2 km', 'time': '4 min', 'icon': 'fa-place-of-worship'},
        {'place': 'Kanak Bhawan', 'distance': '1.0 km', 'time': '4 min', 'icon': 'fa-landmark-dome'},
        {'place': 'Ram Ki Paidi & Saryu Ghat', 'distance': '1.5 km', 'time': '6 min', 'icon': 'fa-water'},
        {'place': 'Ayodhya Dham Junction (Railway)', 'distance': '2.1 km', 'time': '7 min', 'icon': 'fa-train'},
        {'place': 'Maharishi Valmiki Intl Airport (AYJ)', 'distance': '8.5 km', 'time': '15 min', 'icon': 'fa-plane-departure'}
    ]
}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def generate_booking_reference():
    year = datetime.now().year
    digits = ''.join(random.choices(string.digits, k=4))
    return f"SRJ-{year}-{digits}"

@app.route('/healthz')
@app.route('/ping')
def healthz():
    return jsonify({'status': 'healthy', 'trust': 'Shri Ram Janki Sewa Trust'}), 200

@app.errorhandler(Exception)
def handle_exception(e):
    import traceback
    err_tb = traceback.format_exc()
    print(f"CRITICAL FLASK EXCEPTION:\n{err_tb}", flush=True)
    return f"""
    <html>
    <head><title>Diagnostic Error - Shri Ram Janki Sewa Trust</title></head>
    <body style="font-family: sans-serif; padding: 30px; background: #fff5f5; color: #900;">
        <h2>Diagnostic Server Log</h2>
        <p><strong>Error:</strong> {str(e)}</p>
        <pre style="background: #222; color: #0f0; padding: 20px; border-radius: 10px; overflow: auto;">{err_tb}</pre>
    </body>
    </html>
    """, 500

@app.route('/')
def home():
    try:
        return render_template('index.html', trust=TRUST_INFO)
    except Exception as e:
        import traceback
        err_tb = traceback.format_exc()
        print(f"HOME ROUTE ERROR:\n{err_tb}", flush=True)
        return handle_exception(e)

@app.route('/admin')
def admin():
    return render_template('admin.html', trust=TRUST_INFO)

@app.route('/booking-confirmation/<reference>')
def booking_confirmation(reference):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM bookings WHERE booking_reference = ?', (reference,))
    booking = cursor.fetchone()
    conn.close()
    if not booking:
        return redirect(url_for('home'))
    booking_dict = dict(booking)
    return render_template('booking_success.html', booking=booking_dict, trust=TRUST_INFO)

@app.route('/api/upload-image', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({'success': False, 'message': 'No image file found in request'}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No file selected'}), 400
    if file and allowed_file(file.filename):
        ext = file.filename.rsplit('.', 1)[1].lower()
        unique_name = f"hotel_photo_{uuid.uuid4().hex[:10]}.{ext}"
        save_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_name)
        file.save(save_path)
        image_url = f"/static/uploads/{unique_name}"
        return jsonify({'success': True, 'image_url': image_url, 'filename': unique_name}), 201
    return jsonify({'success': False, 'message': 'Invalid file format. Allowed: JPG, PNG, WEBP'}), 400

@app.route('/api/rooms', methods=['GET'])
def get_rooms():
    guest_type = request.args.get('guest_type', 'Indian')
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM rooms ORDER BY id ASC")
    rows = cursor.fetchall()
    conn.close()

    rooms = []
    for row in rows:
        r = dict(row)
        try:
            r['amenities'] = json.loads(r['amenities']) if r['amenities'] else []
        except Exception:
            r['amenities'] = []
        try:
            r['images'] = json.loads(r['images']) if r['images'] else []
        except Exception:
            r['images'] = []
        
        if guest_type == 'NRI':
            r['current_price'] = r['price_nri']
        else:
            r['current_price'] = r['price_indian']

        rooms.append(r)

    return jsonify({'success': True, 'count': len(rooms), 'rooms': rooms})

@app.route('/api/rooms/<int:room_id>', methods=['GET'])
def get_room(room_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM rooms WHERE id = ?', (room_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return jsonify({'success': False, 'message': 'Room not found'}), 404
    r = dict(row)
    r['amenities'] = json.loads(r['amenities']) if r['amenities'] else []
    r['images'] = json.loads(r['images']) if r['images'] else []
    return jsonify({'success': True, 'room': r})

@app.route('/api/rooms/<int:room_id>', methods=['PUT'])
def update_room(room_id):
    data = request.json or {}
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM rooms WHERE id = ?', (room_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({'success': False, 'message': 'Room not found'}), 404

    try:
        updates = []
        params = []
        for key in ['room_number', 'name', 'category', 'bed_type', 'view_type', 'description', 'status']:
            if key in data:
                updates.append(f"{key} = ?")
                params.append(data[key])
        if 'price_indian' in data:
            updates.append("price_indian = ?")
            params.append(float(data['price_indian']))
            updates.append("price_per_night = ?")
            params.append(float(data['price_indian']))
        if 'price_nri' in data:
            updates.append("price_nri = ?")
            params.append(float(data['price_nri']))
        if 'capacity' in data:
            updates.append("capacity = ?")
            params.append(int(data['capacity']))
        if 'images' in data:
            updates.append("images = ?")
            params.append(json.dumps(data['images']))
        if 'amenities' in data:
            updates.append("amenities = ?")
            params.append(json.dumps(data['amenities']))

        if updates:
            params.append(room_id)
            cursor.execute(f"UPDATE rooms SET {', '.join(updates)} WHERE id = ?", params)
            conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Room rates and details updated successfully'})
    except Exception as e:
        conn.close()
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/bookings', methods=['POST'])
def create_booking():
    data = request.json or {}
    required = ['room_id', 'guest_name', 'guest_email', 'check_in', 'check_out']
    for field in required:
        if not data.get(field):
            return jsonify({'success': False, 'message': f'Field {field} is required'}), 400

    guest_type = data.get('guest_type', 'Indian')
    id_proof_number = data.get('id_proof_number', '').strip()
    country_name = data.get('country_name', 'India').strip()
    guest_phone = data.get('guest_phone', '').strip()

    # Validation based on Citizen type
    if guest_type == 'Indian':
        if not id_proof_number:
            return jsonify({'success': False, 'message': 'Aadhaar Card Number is required for Indian citizens'}), 400
        if not guest_phone:
            return jsonify({'success': False, 'message': 'Mobile Number is required for Indian citizens'}), 400
        id_proof_type = 'Aadhaar Card'
        country_name = 'India'
    else:
        if not country_name or country_name.lower() == 'india':
            country_name = data.get('country_name', 'Foreign / NRI')
        if not id_proof_number:
            return jsonify({'success': False, 'message': 'Passport / Foreign Govt ID is required for NRI guests'}), 400
        id_proof_type = 'Passport / Foreign ID'

    room_id = int(data['room_id'])

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM rooms WHERE id = ?', (room_id,))
    room = cursor.fetchone()
    if not room:
        conn.close()
        return jsonify({'success': False, 'message': 'Selected room does not exist'}), 404

    room_dict = dict(room)
    
    try:
        d1 = datetime.strptime(data['check_in'], "%Y-%m-%d")
        d2 = datetime.strptime(data['check_out'], "%Y-%m-%d")
        total_nights = (d2 - d1).days
        if total_nights <= 0:
            total_nights = 1
    except Exception:
        total_nights = 1

    price_per_unit = float(room_dict['price_nri']) if guest_type == 'NRI' else float(room_dict['price_indian'])
    guests_count = int(data.get('guests_count', 1))

    if 'Dormitory' in room_dict['category']:
        total_amount = round(price_per_unit * total_nights * max(1, guests_count), 2)
    else:
        total_amount = round(price_per_unit * total_nights, 2)

    booking_reference = generate_booking_reference()

    payment_method = data.get('payment_method', 'Pay at Trust Reception')
    payment_status = 'Paid' if ('UPI' in payment_method or 'QR' in payment_method) else 'Pending (At Reception)'

    cursor.execute('''
        INSERT INTO bookings (
            booking_reference, room_id, room_name, room_category,
            guest_type, country_name, id_proof_type, id_proof_number,
            guest_name, guest_email, guest_phone, check_in, check_out,
            guests_count, total_nights, price_per_unit, tax_amount, total_amount,
            payment_method, payment_status, booking_status, special_requests
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        booking_reference,
        room_id,
        room_dict['name'],
        room_dict['category'],
        guest_type,
        country_name,
        id_proof_type,
        id_proof_number,
        data['guest_name'],
        data['guest_email'],
        guest_phone,
        data['check_in'],
        data['check_out'],
        guests_count,
        total_nights,
        price_per_unit,
        0,
        total_amount,
        payment_method,
        payment_status,
        'Confirmed',
        data.get('special_requests', '')
    ))

    conn.commit()
    booking_id = cursor.lastrowid
    conn.close()

    return jsonify({
        'success': True,
        'message': 'Payment & Booking Confirmed Successfully!',
        'booking_id': booking_id,
        'booking_reference': booking_reference,
        'total_amount': total_amount,
        'payment_status': payment_status,
        'redirect_url': f"/booking-confirmation/{booking_reference}"
    }), 201

@app.route('/api/bookings', methods=['GET'])
def get_all_bookings():
    status = request.args.get('status')
    search = request.args.get('search')
    
    conn = get_db()
    cursor = conn.cursor()

    query = "SELECT * FROM bookings WHERE 1=1"
    params = []

    if status and status != 'All':
        query += " AND booking_status = ?"
        params.append(status)

    if search:
        query += " AND (booking_reference LIKE ? OR guest_name LIKE ? OR guest_email LIKE ? OR guest_phone LIKE ? OR id_proof_number LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term, term, term])

    query += " ORDER BY id DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    bookings = [dict(r) for r in rows]
    return jsonify({'success': True, 'count': len(bookings), 'bookings': bookings})

@app.route('/api/bookings/<reference_or_email>', methods=['GET'])
def lookup_booking(reference_or_email):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM bookings 
        WHERE UPPER(booking_reference) = UPPER(?) OR LOWER(guest_email) = LOWER(?)
        ORDER BY id DESC
    ''', (reference_or_email, reference_or_email))
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        return jsonify({'success': False, 'message': 'No reservations found for given ID or email'}), 404

    bookings = [dict(r) for r in rows]
    return jsonify({'success': True, 'count': len(bookings), 'bookings': bookings})

@app.route('/api/bookings/<int:booking_id>/status', methods=['PUT'])
def update_booking_status(booking_id):
    data = request.json or {}
    new_status = data.get('status')
    valid_statuses = ['Confirmed', 'Checked-in', 'Checked-out', 'Cancelled']
    
    if new_status not in valid_statuses:
        return jsonify({'success': False, 'message': f'Invalid status. Allowed: {valid_statuses}'}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('UPDATE bookings SET booking_status = ? WHERE id = ?', (new_status, booking_id))
    conn.commit()
    conn.close()

    return jsonify({'success': True, 'message': f'Booking status updated to {new_status}'})

@app.route('/api/stats', methods=['GET'])
def get_stats():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE booking_status != 'Cancelled'")
    total_revenue = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM bookings")
    total_bookings = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM rooms")
    total_rooms = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM rooms WHERE status = 'Available'")
    available_rooms = cursor.fetchone()[0]

    occupancy_rate = round(((total_rooms - available_rooms) / total_rooms * 100) if total_rooms > 0 else 0, 1)

    cursor.execute("SELECT * FROM bookings ORDER BY id DESC LIMIT 5")
    recent_bookings = [dict(r) for r in cursor.fetchall()]

    conn.close()

    return jsonify({
        'success': True,
        'stats': {
            'total_revenue': total_revenue,
            'total_bookings': total_bookings,
            'total_rooms': total_rooms,
            'available_rooms': available_rooms,
            'occupancy_rate': occupancy_rate,
            'recent_bookings': recent_bookings
        }
    })

@app.route('/api/inquiries', methods=['POST'])
def submit_inquiry():
    data = request.json or {}
    name = data.get('name')
    email = data.get('email')
    message = data.get('message')

    if not name or not email or not message:
        return jsonify({'success': False, 'message': 'Name, email and message are required'}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO inquiries (name, email, phone, subject, message)
        VALUES (?, ?, ?, ?, ?)
    ''', (name, email, data.get('phone', ''), 'Yatra Inquiry', message))
    conn.commit()
    conn.close()

    return jsonify({'success': True, 'message': 'Jai Shri Ram! Our Sewa Desk will contact you shortly.'})

@app.route('/api/inquiries', methods=['GET'])
def get_inquiries():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM inquiries ORDER BY id DESC')
    rows = cursor.fetchall()
    conn.close()
    return jsonify({'success': True, 'inquiries': [dict(r) for r in rows]})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f'Starting Shri Ram Janki Sewa Trust on port {port}')
    app.run(host='0.0.0.0', port=port)
