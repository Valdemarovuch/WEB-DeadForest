"""
Script to generate test sales data for the admin dashboard chart
Run with: python -m backend.scripts.generate_sales_data
"""
import sys
import os
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from datetime import datetime, timedelta
import random
from backend.app.core.database import SessionLocal
from backend.app.models.order import Order
from backend.app.models.user import User

def generate_sales_data(days: int = 90, orders_per_day_range: tuple = (5, 20)):
    """
    Generate random sales data for the past N days
    
    Args:
        days: Number of days back to generate data for
        orders_per_day_range: Min and max orders per day (min, max)
    """
    db = SessionLocal()
    
    try:
        # Get a user to assign orders to (or create one)
        user = db.query(User).first()
        if not user:
            print("No users found in database. Creating a test user...")
            from backend.app.core.auth import get_password_hash
            user = User(
                name="Test User",
                email="test@example.com",
                password_hash=get_password_hash("password123"),
                age=25
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        print(f"Generating sales data for the past {days} days...")
        
        now = datetime.utcnow()
        total_orders_created = 0
        
        for day_offset in range(days):
            # Random number of orders per day
            num_orders = random.randint(*orders_per_day_range)
            
            for _ in range(num_orders):
                # Random time during that day
                order_date = now - timedelta(days=day_offset) - timedelta(
                    hours=random.randint(0, 23),
                    minutes=random.randint(0, 59),
                    seconds=random.randint(0, 59)
                )
                
                # Random order amounts (realistic e-commerce values)
                subtotal = round(random.uniform(20, 500), 2)
                discount = round(subtotal * random.choice([0, 0, 0, 0.1, 0.15, 0.2]), 2)  # 20% chance of discount
                tax = round((subtotal - discount) * 0.08, 2)  # 8% tax
                total = round(subtotal - discount + tax, 2)
                
                # Random status (mostly completed)
                status = random.choices(
                    ["pending", "completed", "cancelled"],
                    weights=[10, 80, 10]  # 80% completed
                )[0]
                
                order = Order(
                    user_id=user.id,
                    subtotal=subtotal,
                    discount=discount,
                    tax=tax,
                    total=total,
                    status=status,
                    created_at=order_date
                )
                db.add(order)
                total_orders_created += 1
            
            # Commit every day to avoid huge transactions
            if day_offset % 10 == 0:
                db.commit()
                print(f"  Progress: {day_offset}/{days} days processed...")
        
        # Final commit
        db.commit()
        
        print(f"\n✓ Successfully generated {total_orders_created} orders over {days} days")
        print(f"  Average: {total_orders_created / days:.1f} orders/day")
        
        # Show summary statistics
        from sqlalchemy import func
        stats = db.query(
            func.count(Order.id).label("count"),
            func.sum(Order.total).label("revenue"),
            func.avg(Order.total).label("avg_order")
        ).filter(Order.status == "completed").first()
        
        print(f"\nSummary (completed orders only):")
        print(f"  Total Orders: {stats.count}")
        print(f"  Total Revenue: ${stats.revenue:,.2f}")
        print(f"  Average Order: ${stats.avg_order:.2f}")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Generate test sales data")
    parser.add_argument("--days", type=int, default=90, help="Number of days to generate data for (default: 90)")
    parser.add_argument("--min-orders", type=int, default=5, help="Minimum orders per day (default: 5)")
    parser.add_argument("--max-orders", type=int, default=20, help="Maximum orders per day (default: 20)")
    parser.add_argument("--clear", action="store_true", help="Clear existing orders before generating")
    
    args = parser.parse_args()
    
    if args.clear:
        print("Clearing existing orders...")
        db = SessionLocal()
        try:
            deleted = db.query(Order).delete()
            db.commit()
            print(f"  Deleted {deleted} existing orders")
        finally:
            db.close()
    
    generate_sales_data(
        days=args.days,
        orders_per_day_range=(args.min_orders, args.max_orders)
    )
