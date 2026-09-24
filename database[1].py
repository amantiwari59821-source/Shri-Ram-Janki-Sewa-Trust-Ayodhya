import sqlite3
import os
import json

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'hotel.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db(force_reseed=False):
    conn = get_db()
    cursor = conn.cursor()

    if force_reseed:
        cursor.execute('DROP TABLE IF EXISTS rooms')
        cursor.execute('DROP TABLE IF EXISTS bookings')
        cursor.execute('DROP TABLE IF EXISTS inquiries')

    # Rooms table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_number TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            tagline TEXT NOT NULL,
            price_indian REAL NOT NULL,
            price_nri REAL NOT NULL,
            price_per_night REAL NOT NULL,
            capacity INTEGER NOT NULL,
            capacity_text TEXT NOT NULL,
            bed_type TEXT NOT NULL,
            floor TEXT NOT NULL,
            bath_type TEXT NOT NULL,
            size_sqft INTEGER NOT NULL,
            view_type TEXT NOT NULL,
            description TEXT NOT NULL,
            amenities TEXT NOT NULL,
            images TEXT NOT NULL,
            status TEXT DEFAULT 'Available',
            rating REAL DEFAULT 4.9,
            reviews_count INTEGER DEFAULT 24,
            featured INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Bookings table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_reference TEXT UNIQUE NOT NULL,
            room_id INTEGER NOT NULL,
            room_name TEXT NOT NULL,
            room_category TEXT NOT NULL,
            guest_type TEXT DEFAULT 'Indian',
            country_name TEXT DEFAULT 'India',
            id_proof_type TEXT DEFAULT 'Aadhaar Card',
            id_proof_number TEXT,
            guest_name TEXT NOT NULL,
            guest_email TEXT NOT NULL,
            guest_phone TEXT,
            check_in DATE NOT NULL,
            check_out DATE NOT NULL,
            guests_count INTEGER NOT NULL,
            total_nights INTEGER NOT NULL,
            price_per_unit REAL NOT NULL,
            tax_amount REAL DEFAULT 0,
            total_amount REAL NOT NULL,
            payment_method TEXT NOT NULL,
            payment_status TEXT DEFAULT 'Pending',
            booking_status TEXT DEFAULT 'Confirmed',
            special_requests TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (room_id) REFERENCES rooms (id)
        )
    """)

    # Inquiries table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS inquiries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT DEFAULT 'New',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 6 Exact Room Types with User's Real Uploaded Photos
    sample_rooms = [
        (
            '101',
            '2 Bed AC Room',
            '2 Bed AC',
            'Compact AC stay for two pilgrims',
            1299.0,
            1299.0,
            1299.0,
            2,
            '2 Guests',
            'Double Bed',
            'Ground / 1st Floor',
            'Western Attached Let-Bath',
            280,
            'Ayodhya Mandir Area View',
            'Real YatraDham listing category with a double bed, western attached let-bath, and ground / first floor allocation. Designed for couples or two family members seeking a comfortable Ayodhya stay.',
            json.dumps(['Air Conditioning (AC)', 'Double Bed', 'Western Attached Let-Bath', 'Food Facility Available', 'Free Parking', 'CCTV Security', '24/7 Water']),
            json.dumps(['/static/uploads/hotel_photo_0d4190c33a.jpeg', '/static/uploads/hotel_photo_992c83feca.jpeg', '/static/uploads/hotel_photo_ccee89aeb6.jpeg']),
            'Available',
            4.9,
            42,
            1
        ),
        (
            '102',
            '3 Bed AC Room',
            '3 Bed AC',
            'AC family room with double + single bed',
            1499.0,
            1499.0,
            1499.0,
            3,
            '3 Guests',
            'Double Bed + Single Bed',
            'Ground / 1st Floor',
            'Western Attached Let-Bath',
            320,
            'Sacred Courtyard View',
            'A practical AC family room category with one double bed, one single bed, western attached let-bath, and ground / first floor allocation as mentioned on the booking listing.',
            json.dumps(['Air Conditioning (AC)', 'Double Bed', 'Single Bed', 'Western Attached Let-Bath', 'Hot Water Geyser', 'Clean Drinking Water', 'Free Parking']),
            json.dumps(['/static/uploads/hotel_photo_992c83feca.jpeg', '/static/uploads/hotel_photo_0d4190c33a.jpeg', '/static/uploads/hotel_photo_ccee89aeb6.jpeg']),
            'Available',
            4.9,
            38,
            1
        ),
        (
            '103',
            '3 Bed Non AC Room',
            '3 Bed Non-AC',
            'Budget family room with common let-bath',
            1099.0,
            1099.0,
            1099.0,
            3,
            '3 Guests',
            'Double Bed + Single Bed',
            'Ground / 1st Floor',
            'Indian or Western Common Let-Bath',
            300,
            'Peaceful Trust Garden View',
            'Affordable non-AC option listed with one double bed, one single bed, and Indian or western common let-bath. Suitable for value-conscious yatris and small families.',
            json.dumps(['Ceiling Fan & High Ventilation', 'Double Bed', 'Single Bed', 'Common Let-Bath', 'Satvik Food Facility', 'CCTV Surveillance', 'Purified RO Water']),
            json.dumps(['/static/uploads/hotel_photo_ccee89aeb6.jpeg', '/static/uploads/hotel_photo_992c83feca.jpeg', '/static/uploads/hotel_photo_0d4190c33a.jpeg']),
            'Available',
            4.8,
            29,
            1
        ),
        (
            '104',
            '4 Bed AC Room',
            '4 Bed AC',
            'Spacious AC room with geyser',
            1799.0,
            1799.0,
            1799.0,
            4,
            '4 Guests',
            '2 Double Beds',
            '1st Floor',
            'Western Attached Let-Bath',
            380,
            'Ayodhya Mandir Area View',
            'Four-guest AC room category with two double beds, geyser facility, western attached let-bath, and first-floor allocation for a comfortable family pilgrimage stay.',
            json.dumps(['Air Conditioning (AC)', '2 Double Beds', 'Hot Water Geyser', 'Attached Let-Bath', 'Food Facility', 'Free Parking', 'Power Backup']),
            json.dumps(['/static/uploads/hotel_photo_0d4190c33a.jpeg', '/static/uploads/hotel_photo_992c83feca.jpeg', '/static/uploads/hotel_photo_aa46c7b60b.png']),
            'Available',
            4.95,
            56,
            1
        ),
        (
            '105',
            '5 Bed AC Room',
            '5 Bed AC',
            'Large AC room for group stays',
            1999.0,
            1999.0,
            1999.0,
            5,
            '5 Guests',
            '2 Double Beds + Single Bed',
            '1st Floor',
            'Western Attached Let-Bath',
            450,
            'Upper Floor Terrace View',
            'Five-guest AC room category with two double beds, one single bed, western attached let-bath, and first-floor allocation for group darshan visits.',
            json.dumps(['Air Conditioning (AC)', '2 Double Beds', '1 Single Bed', 'Western Attached Let-Bath', 'Clean Drinking Water', 'CCTV Security', 'Parking']),
            json.dumps(['/static/uploads/hotel_photo_992c83feca.jpeg', '/static/uploads/hotel_photo_0d4190c33a.jpeg', '/static/uploads/hotel_photo_ccee89aeb6.jpeg']),
            'Available',
            4.9,
            34,
            1
        ),
        (
            '106',
            'AC Dormitory Hall',
            'Dormitory',
            'Group hall for up to 25 persons',
            560.0,
            560.0,
            560.0,
            25,
            '25 Person Capacity',
            'Mattress Only (Per Bed)',
            'Dormitory Floor',
            'Indian or Western Common Let-Bath',
            850,
            'Sacred Trust Hall View',
            'Dormitory accommodation listed with 25-person capacity, mattress-only arrangement, and Indian or western common let-bath for large groups and yatri batches.',
            json.dumps(['AC Dormitory Hall', 'Single Bedding / Mattress', 'Common Let-Bath', 'Satvik Bhojan Coordination', 'Locker Facility', '24/7 Hot Water']),
            json.dumps(['/static/uploads/hotel_photo_aa46c7b60b.png', '/static/uploads/hotel_photo_0d4190c33a.jpeg', '/static/uploads/hotel_photo_992c83feca.jpeg']),
            'Available',
            4.95,
            112,
            1
        )
    ]

    cursor.execute('DELETE FROM rooms')
    cursor.executemany("""
        INSERT INTO rooms (
            room_number, name, category, tagline, price_indian, price_nri,
            price_per_night, capacity, capacity_text, bed_type, floor, bath_type,
            size_sqft, view_type, description, amenities, images, status,
            rating, reviews_count, featured
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, sample_rooms)

    conn.commit()
    conn.close()
    print("Database seeded with 6 exact rooms from shrisitaramsevatrust.")

if __name__ == '__main__':
    init_db(force_reseed=True)
