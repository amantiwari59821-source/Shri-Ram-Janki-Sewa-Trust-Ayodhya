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
        cursor.execute('DROP TABLE IF EXISTS services')

    # Rooms table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_number TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            price_indian REAL NOT NULL,
            price_nri REAL NOT NULL,
            price_per_night REAL NOT NULL,
            capacity INTEGER NOT NULL,
            bed_type TEXT NOT NULL,
            size_sqft INTEGER NOT NULL,
            view_type TEXT NOT NULL,
            description TEXT NOT NULL,
            amenities TEXT NOT NULL,
            images TEXT NOT NULL,
            status TEXT DEFAULT 'Available',
            rating REAL DEFAULT 4.9,
            reviews_count INTEGER DEFAULT 18,
            featured INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Bookings table with Aadhaar / Country ID fields
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_reference TEXT UNIQUE NOT NULL,
            room_id INTEGER NOT NULL,
            room_name TEXT NOT NULL,
            room_category TEXT NOT NULL,
            guest_type TEXT DEFAULT 'Indian', -- 'Indian' or 'NRI'
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
    ''')

    # Inquiries table
    cursor.execute('''
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
    ''')

    cursor.execute('SELECT COUNT(*) FROM rooms')
    if cursor.fetchone()[0] == 0:
        sample_rooms = [
            (
                '101',
                'AC Room (वातानुकूलित कक्ष)',
                'AC Room',
                3000.0,
                5500.0,
                3000.0,
                2,
                '1 Double Bed / 2 Twin Beds',
                320,
                'Ayodhya Mandir Area View',
                'Clean, comfortable fully air-conditioned room with attached modern bathroom, 24/7 hot & cold water, high-speed Wi-Fi, and peaceful sacred ambiance.',
                json.dumps(['Air Conditioning (AC)', 'Attached Bathroom', '24/7 Hot & Cold Water', 'Free High-Speed Wi-Fi', 'Clean Linen & Towels', 'Electric Kettle', 'Power Backup']),
                json.dumps([
                    '/static/uploads/hotel_photo_0d4190c33a.jpeg',
                    '/static/uploads/hotel_photo_aa46c7b60b.png',
                    '/static/uploads/hotel_photo_992c83feca.jpeg'
                ]),
                'Available',
                4.9,
                42,
                1
            ),
            (
                '102',
                'Non-AC Room (नॉन-एसी कक्ष)',
                'Non-AC Room',
                1500.0,
                3500.0,
                1500.0,
                2,
                '1 Double Bed / 2 Single Beds',
                280,
                'Peaceful Courtyard View',
                'Well-ventilated clean non-AC room with high-speed ceiling fans, attached clean washroom, 24/7 water supply, and comfortable bedding for yatris.',
                json.dumps(['Ceiling Fan & Ventilation', 'Attached Washroom', '24/7 Water Supply', 'Free Wi-Fi', 'Clean Bedsheets & Pillows', 'Power Backup']),
                json.dumps([
                    '/static/uploads/hotel_photo_992c83feca.jpeg',
                    '/static/uploads/hotel_photo_aa46c7b60b.png',
                    '/static/uploads/hotel_photo_0d4190c33a.jpeg'
                ]),
                'Available',
                4.8,
                35,
                1
            ),
            (
                '103',
                'Dormitory Hall (डॉर्मिटरी / हाल)',
                'Dormitory',
                200.0,
                1000.0,
                200.0,
                1,
                'Single Bed / Bunk Bed in Hall',
                750,
                'Sacred Trust Hall View',
                'Economical and clean dormitory bedding setup with individual locker, clean mattress, common sanitized washrooms, and safe space for solo yatris & groups.',
                json.dumps(['Single Bedding / Mattress', 'Shared Clean Bathrooms', 'Personal Locker Facility', '24/7 Hot Water in Bathrooms', 'Free Wi-Fi in Lounge', 'Purified RO Drinking Water']),
                json.dumps([
                    '/static/uploads/hotel_photo_aa46c7b60b.png',
                    '/static/uploads/hotel_photo_0d4190c33a.jpeg',
                    '/static/uploads/hotel_photo_992c83feca.jpeg'
                ]),
                'Available',
                4.95,
                88,
                1
            )
        ]
        cursor.executemany('''
            INSERT INTO rooms (
                room_number, name, category, price_indian, price_nri,
                price_per_night, capacity, bed_type, size_sqft, view_type,
                description, amenities, images, status, rating, reviews_count, featured
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', sample_rooms)

    conn.commit()
    conn.close()
    print("Database re-initialized cleanly.")

if __name__ == '__main__':
    init_db(force_reseed=True)
