from flask import Flask
from flask_cors import CORS
from pymongo import MongoClient
from app.config import Config

# MongoDB client
mongo_client = None
db = None

def create_app():
    global mongo_client, db
    
    app = Flask(__name__)
    
    # Enable CORS for React Native app
    CORS(app, resources={r"/*": {"origins": "*"}})
    
    # Connect to MongoDB
    mongo_client = MongoClient(Config.MONGODB_URI)
    # Explicitly specify database name
    db = mongo_client['video_app']
    
    # Create indexes
    db.users.create_index("email", unique=True)
    db.videos.create_index("is_active")
    
    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.video import video_bp
    
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(video_bp)
    
    @app.route('/health')
    def health_check():
        return {'status': 'healthy', 'message': 'API is running'}
    
    return app

def get_db():
    return db
