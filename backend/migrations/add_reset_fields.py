"""
Migration script to add password reset fields to users table
Run this with: python -m backend.migrations.add_reset_fields
"""
import sqlite3
import os

def migrate():
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'lab.db')
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(users)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'reset_token' not in columns:
            print("Adding reset_token column...")
            cursor.execute("ALTER TABLE users ADD COLUMN reset_token VARCHAR(255)")
            print("✓ Added reset_token column")
        else:
            print("reset_token column already exists")
        
        if 'reset_token_expires' not in columns:
            print("Adding reset_token_expires column...")
            cursor.execute("ALTER TABLE users ADD COLUMN reset_token_expires DATETIME")
            print("✓ Added reset_token_expires column")
        else:
            print("reset_token_expires column already exists")
        
        conn.commit()
        print("\n✓ Migration completed successfully!")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
