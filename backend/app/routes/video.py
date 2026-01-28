from flask import Blueprint, request, jsonify
import logging
from datetime import datetime
from app import get_db
from app.models.video import Video
from app.middleware.auth import token_required

# Setup logging
logger = logging.getLogger(__name__)

video_bp = Blueprint('video', __name__)


@video_bp.route('/dashboard', methods=['GET'])
@token_required
def get_dashboard():
    """
    Get dashboard with videos (pagination-ready).
    Query params:
    - page: page number (default 1)
    - limit: videos per page (default 2, max 20)
    """
    try:
        db = get_db()
        video_model = Video(db)
        
        # Seed sample videos if none exist
        video_model.seed_sample_videos()
        
        # Get pagination params
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 2, type=int)
        
        # Validate params
        page = max(1, page)
        limit = min(max(1, limit), 20)  # Max 20 per page
        
        # Get paginated videos
        videos, total_count = video_model.get_active_videos_paginated(
            page=page, 
            limit=limit
        )
        
        # Calculate pagination metadata
        total_pages = (total_count + limit - 1) // limit if total_count > 0 else 1
        
        logger.info(f"Dashboard accessed by user {request.user_id}, page {page}")
        
        return jsonify({
            'videos': videos,
            'pagination': {
                'page': page,
                'limit': limit,
                'total_items': total_count,
                'total_pages': total_pages,
                'has_next': page < total_pages,
                'has_prev': page > 1
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Dashboard error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# video streaming endpoints
@video_bp.route('/video/<video_id>/stream', methods=['GET'])
@token_required 
def get_video_stream(video_id):
    """
    Get video stream URL with playback token.
    This is the YouTube abstraction layer - the app never sees raw YouTube URLs!
    """
    try:
        db = get_db()
        video_model = Video(db)
        
        # Find the video
        video = video_model.find_by_id(video_id)
        if not video:
            return jsonify({'error': 'Video not found'}), 404
        
        # Generate playback token
        playback_token = video_model.generate_playback_token(video_id, request.user_id)
        
        # Get embed URL (only backend has access to youtube_id)
        embed_url = video_model.get_embed_url(video)
        
        logger.info(f"Video stream requested: {video_id} by user {request.user_id}")
        
        return jsonify({
            'video_id': video_id,
            'title': video['title'],
            'description': video['description'],
            'playback_token': playback_token,
            'embed_url': embed_url  # This is youtube.com/embed/xxx, not watch?v=xxx
        }), 200
        
    except Exception as e:
        logger.error(f"Video stream error: {str(e)}")
        return jsonify({'error': str(e)}), 500



@video_bp.route('/video/verify-token', methods=['POST'])
@token_required
def verify_playback_token():
    """Verify a playback token (for additional security if needed)"""
    data = request.get_json()
    
    if not data or 'playback_token' not in data:
        return jsonify({'error': 'Playback token required'}), 400
    
    try:
        db = get_db()
        video_model = Video(db)
        
        payload = video_model.verify_playback_token(data['playback_token'])
        
        if not payload:
            return jsonify({'error': 'Invalid or expired playback token'}), 401
        
        return jsonify({
            'valid': True,
            'video_id': payload['video_id']
        }), 200
        
    except Exception as e:
        logger.error(f"Token verify error: {str(e)}")
        return jsonify({'error': str(e)}), 500
