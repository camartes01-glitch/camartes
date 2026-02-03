from apscheduler.schedulers.background import BackgroundScheduler
from jobs.cleanup_sessions import cleanup_expired_sessions
from jobs.process_bookings import complete_bookings

scheduler = BackgroundScheduler()

def start_scheduler():
    scheduler.add_job(cleanup_expired_sessions, "interval", minutes=30)
    scheduler.add_job(complete_bookings, "interval", hours=1)
    scheduler.start()
