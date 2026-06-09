from sqlalchemy import create_engine, text
engine = create_engine('postgresql+psycopg://danilo:password@localhost:5432/danilo')
with engine.connect() as conn:
    print(conn.execute(text("SELECT conname, pg_get_constraintdef(c.oid) FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace WHERE contype = 'c'")).fetchall())
