from bson import ObjectId
import jwt
import time
from app.config import Config

class Video:
    def __init__(self, db):
        self.collection = db.videos
    
    def get_active_videos(self, limit=2):
        """Get active videos for dashboard (limited to 2 as per requirement)"""
        videos = self.collection.find({'is_active': True}).limit(limit)
        return [self.to_dict(v) for v in videos]
    
    def get_active_videos_paginated(self, page=1, limit=2):
        """Get active videos with pagination support"""
        skip = (page - 1) * limit
        
        # Get total count
        total_count = self.collection.count_documents({'is_active': True})
        
        # Get paginated videos
        videos = self.collection.find({'is_active': True}).skip(skip).limit(limit)
        
        return [self.to_dict(v) for v in videos], total_count
    
    def find_by_id(self, video_id):
        """Find video by ID"""
        try:
            return self.collection.find_one({'_id': ObjectId(video_id)})
        except:
            return None
    
    def to_dict(self, video):
        """Convert video document to dictionary (WITHOUT youtube_id - this is the abstraction!)"""
        if not video:
            return None
        return {
            'id': str(video['_id']),
            'title': video['title'],
            'description': video['description'],
            'thumbnail_url': video['thumbnail_url']
            # NOTE: youtube_id is NOT exposed here - this is the key security feature!
        }
        
    
    def generate_playback_token(self, video_id, user_id):
        """Generate a signed playback token for video streaming"""
        payload = {
            'video_id': video_id,
            'user_id': user_id,
            'exp': int(time.time()) + 3600  # Token expires in 1 hour
        }
        return jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm='HS256')
    
    def verify_playback_token(self, token):
        """Verify playback token and return payload"""
        try:
            payload = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    #  sending the youtube url
    def get_embed_url(self, video):
        """Get YouTube embed URL (only called after token verification)"""
        if not video:
            return None
        youtube_id = video.get('youtube_id')
        if not youtube_id:
            return None
        # Return embed URL, not direct youtube.com/watch URL
        return f"https://www.youtube.com/embed/{youtube_id}"
    
    def seed_sample_videos(self):
        """Seed sample videos for demonstration"""
        # Using verified embeddable YouTube videos
        sample_videos = [
            {
                'title': 'Big Buck Bunny',
                'description': 'A large rabbit deals with three bullying rodents. A classic open-source animated short film.',
                'youtube_id': 'aqz-KE-bpKQ',  # Big Buck Bunny - always embeddable
                'thumbnail_url': 'https://img.youtube.com/vi/aqz-KE-bpKQ/maxresdefault.jpg',
                'is_active': True
            },
            {
                'title': 'The Power of Vulnerability',
                'description': 'Brené Brown studies human connection - our ability to empathize, belong, and love.',
                'youtube_id': 'iCvmsMzlF7o',  # TED Talk - embeddable
                'thumbnail_url': 'https://img.youtube.com/vi/iCvmsMzlF7o/maxresdefault.jpg',
                'is_active': True
            }
        ]
        
        # Delete existing videos and reseed with new ones
        self.collection.delete_many({})
        self.collection.insert_many(sample_videos)
        return True

