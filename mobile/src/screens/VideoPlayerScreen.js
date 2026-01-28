import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import { videoAPI } from '../services/api';

const { width } = Dimensions.get('window');

export default function VideoPlayerScreen({ route, navigation }) {
  const { videoId, title } = route.params;
  const [videoData, setVideoData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    loadVideoStream();
  }, [videoId]);

  const loadVideoStream = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Fetch video stream URL from backend (YouTube abstraction happens here!)
      const response = await videoAPI.getVideoStream(videoId);
      setVideoData(response.data);
    } catch (error) {
      console.error('Error loading video:', error);
      setError('Failed to load video');
    } finally {
      setIsLoading(false);
    }
  };

  // Extract YouTube video ID from embed URL
  const getYouTubeId = (embedUrl) => {
    if (!embedUrl) return null;
    const match = embedUrl.match(/embed\/([^?]+)/);
    return match ? match[1] : null;
  };

  const youtubeId = getYouTubeId(videoData?.embed_url);

  const onStateChange = useCallback((state) => {
    if (state === 'ended') {
      setPlaying(false);
      // Auto navigate back to prevent showing related videos
      navigation.goBack();
    }
  }, [navigation]);


  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading video...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadVideoStream}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Video Player */}
      <View style={styles.videoContainer}>
        {youtubeId ? (
          <YoutubePlayer
            height={width * 0.5625}
            width={width}
            play={playing}
            videoId={youtubeId}
            onChangeState={onStateChange}
            initialPlayerParams={{
              modestbranding: true,  // Hide YouTube logo
              rel: false,            // Don't show related videos
              showClosedCaptions: false,
              controls: true,
            }}
            webViewProps={{
              allowsInlineMediaPlayback: true,
              mediaPlaybackRequiresUserAction: false,
            }}
          />
        ) : (
          <View style={styles.noVideoContainer}>
            <Ionicons name="videocam-off" size={48} color="#666" />
            <Text style={styles.noVideoText}>Video not available</Text>
          </View>
        )}
      </View>

      {/* Video Controls */}
      {/* <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setPlaying(!playing)}
        >
          <Ionicons 
            name={playing ? "pause" : "play"} 
            size={28} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View> */}

      {/* Video Info */}
      <ScrollView style={styles.infoContainer}>
        <Text style={styles.videoTitle}>{videoData?.title}</Text>
        <Text style={styles.videoDescription}>{videoData?.description}</Text>
        
        {/* Playback Token Info (for demo purposes) */}
        <View style={styles.tokenInfo}>
          <Ionicons name="shield-checkmark" size={16} color="#22c55e" />
          <Text style={styles.tokenText}>Secure playback with signed token</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#0a0a0a',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  videoContainer: {
    width: width,
    height: width * 0.5625, // 16:9 aspect ratio
    backgroundColor: '#000',
  },
  noVideoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noVideoText: {
    color: '#666',
    marginTop: 12,
    fontSize: 14,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#111',
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    padding: 20,
  },
  videoTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  videoDescription: {
    fontSize: 15,
    color: '#888',
    lineHeight: 22,
    marginBottom: 24,
  },
  tokenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  tokenText: {
    color: '#22c55e',
    fontSize: 13,
  },
});
