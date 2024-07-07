class Config:
    SECRET_KEY = '35wsetr3w5w3rw53w6te5yeye45'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///site.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DISCORD_CLIENT_ID = '1259571362180370485'
    DISCORD_CLIENT_SECRET = '4XNJukUZf1SpJKEmm7qOzHVZArSERTHk'
    DISCORD_REDIRECT_URI = 'YOUR_DISCORD_REDIRECT_URI'  # Replace with your redirect URI
    ENV = 'development'  # or 'production'
