from flask import Blueprint, request, jsonify
import jwt
import time
import logging
from functools import wraps
from pymongo.errors import DuplicateKeyError
from app import get_db
from app.models.user import User
from app.config import Config
from app.middleware.auth import token_required

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__)

# In-memory rate limiting store (use Redis in production)
login_attempts = {}
RATE_LIMIT_WINDOW = 300  # 5 minutes
MAX_LOGIN_ATTEMPTS = 5


def rate_limit_login(f):
    """Rate limiting decorator for login endpoint"""
    @wraps(f)
    def decorated(*args, **kwargs):
        client_ip = request.remote_addr
        current_time = time.time()
        
        # Clean old entries
        if client_ip in login_attempts:
            login_attempts[client_ip] = [
                t for t in login_attempts[client_ip] 
                if current_time - t < RATE_LIMIT_WINDOW
            ]
        
        # Check rate limit
        if client_ip in login_attempts and len(login_attempts[client_ip]) >= MAX_LOGIN_ATTEMPTS:
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            return jsonify({
                'error': 'Too many login attempts. Please try again in 5 minutes.'
            }), 429
        
        return f(*args, **kwargs)
    return decorated


def record_login_attempt(ip):
    """Record a failed login attempt"""
    if ip not in login_attempts:
        login_attempts[ip] = []
    login_attempts[ip].append(time.time())


@auth_bp.route('/signup', methods=['POST'])
def signup():
    """Register a new user"""
    data = request.get_json()
    
    # Validate input
    if not data:
        logger.warning("Signup attempt with no data")
        return jsonify({'error': 'No data provided'}), 400
    
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    
    if not name or not email or not password:
        return jsonify({'error': 'Name, email, and password are required'}), 400
    
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    
    try:
        db = get_db()
        user_model = User(db)
        user_id = user_model.create(name, email, password)
        
        # Generate tokens
        access_token = generate_access_token(user_id)
        refresh_token = generate_refresh_token(user_id)
        
        logger.info(f"New user registered: {email}")
        
        return jsonify({
            'message': 'User created successfully',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token': access_token,  # Backward compatibility
            'user': {
                'id': user_id,
                'name': name,
                'email': email.lower()
            }
        }), 201
        
    except DuplicateKeyError:
        logger.warning(f"Signup failed - email already exists: {email}")
        return jsonify({'error': 'Email already exists'}), 409
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
@rate_limit_login
def login():
    """Login user and return JWT tokens"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    print('data recieved from frontend',data)    
    
    email = data.get('email', '').strip()
    password = data.get('password', '')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    try:
        db = get_db()
        user_model = User(db)
        user = user_model.find_by_email(email)
        
        if not user:
            record_login_attempt(request.remote_addr)
            logger.warning(f"Failed login attempt - user not found: {email}")
            return jsonify({'error': 'Invalid email or password'}), 401
        
        if not user_model.verify_password(user['password_hash'], password):
            record_login_attempt(request.remote_addr)
            logger.warning(f"Failed login attempt - wrong password: {email}")
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Generate tokens
        access_token = generate_access_token(str(user['_id']))
        refresh_token = generate_refresh_token(str(user['_id']))
        
        logger.info(f"User logged in: {email}")
        
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token': access_token,  # Backward compatibility
            'user': user_model.to_dict(user)
        }), 200
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/refresh', methods=['POST'])
def refresh_token():
    """Refresh access token using refresh token"""
    data = request.get_json()
    
    if not data or 'refresh_token' not in data:
        return jsonify({'error': 'Refresh token required'}), 400
    
    try:
        # Verify refresh token
        payload = jwt.decode(
            data['refresh_token'], 
            Config.JWT_SECRET_KEY, 
            algorithms=['HS256']
        )
        
        if payload.get('type') != 'refresh':
            return jsonify({'error': 'Invalid token type'}), 401
        
        user_id = payload['user_id']
        
        # Generate new access token
        new_access_token = generate_access_token(user_id)
        
        logger.info(f"Token refreshed for user: {user_id}")
        
        return jsonify({
            'access_token': new_access_token,
            'token': new_access_token  # Backward compatibility
        }), 200
        
    except jwt.ExpiredSignatureError:
        logger.warning("Refresh token expired")
        return jsonify({'error': 'Refresh token expired. Please login again.'}), 401
    except jwt.InvalidTokenError:
        logger.warning("Invalid refresh token")
        return jsonify({'error': 'Invalid refresh token'}), 401


@auth_bp.route('/me', methods=['GET'])
@token_required
def get_profile():
    """Get current user profile (requires JWT)"""
    try:
        db = get_db()
        user_model = User(db)
        user = user_model.find_by_id(request.user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user_model.to_dict(user)}), 200
        
    except Exception as e:
        logger.error(f"Get profile error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout():
    """Logout user (client should discard token)"""
    logger.info(f"User logged out: {request.user_id}")
    return jsonify({'message': 'Logged out successfully'}), 200


def generate_access_token(user_id):
    """Generate short-lived access token (1 hour)"""
    payload = {
        'user_id': user_id,
        'type': 'access',
        'exp': int(time.time()) + 3600  # 1 hour
    }
    return jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm='HS256')


def generate_refresh_token(user_id):
    """Generate long-lived refresh token (7 days)"""
    payload = {
        'user_id': user_id,
        'type': 'refresh',
        'exp': int(time.time()) + (7 * 24 * 3600)  # 7 days
    }
    return jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm='HS256')


# Backward compatibility
def generate_token(user_id):
    """Generate JWT token for user (deprecated, use generate_access_token)"""
    return generate_access_token(user_id)
