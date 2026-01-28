from datetime import datetime
from bson import ObjectId
import bcrypt

class User:
    def __init__(self, db):
        self.collection = db.users
    
    def create(self, name, email, password):
        """Create a new user with hashed password"""
        # Hash password
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        user_doc = {
            'name': name,
            'email': email.lower(),
            'password_hash': password_hash,
            'created_at': datetime.utcnow()
        }
        
        result = self.collection.insert_one(user_doc)
        return str(result.inserted_id)
    
    def find_by_email(self, email):
        """Find user by email"""
        return self.collection.find_one({'email': email.lower()})
    
    def find_by_id(self, user_id):
        """Find user by ID"""
        return self.collection.find_one({'_id': ObjectId(user_id)})
    
    def verify_password(self, stored_hash, password):
        """Verify password against stored hash"""
        return bcrypt.checkpw(password.encode('utf-8'), stored_hash)
    
    def to_dict(self, user):
        """Convert user document to dictionary (without password)"""
        if not user:
            return None
        return {
            'id': str(user['_id']),
            'name': user['name'],
            'email': user['email'],
            'created_at': user['created_at'].isoformat() if user.get('created_at') else None
        }
