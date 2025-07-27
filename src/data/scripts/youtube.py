import argparse
import os

from dotenv import load_dotenv
from googleapiclient.discovery import build

class YoutubeChannel:
    def __init__(self, channel_id, youtube):
        self._channel_id = channel_id
        self._load(youtube)
    
    def _load(self, youtube):
        response = youtube.channels().list(
            part='snippet,contentDetails',
            id=self.channel_id
        ).execute()

        item = response['items'][0]

        self._title = item['snippet']['title']
        self._description = item['snippet']['description']
        self._thumbnails = item['snippet']['thumbnails']
        self._uploads_playlist_id = item['contentDetails']['relatedPlaylists']['uploads']

    @property
    def channel_id(self):
        return self._channel_id
    @property
    def title(self):
        return self._title
    @property
    def description(self):
        return self._description
    @property
    def thumbnails(self):
        return self._thumbnails
    @property
    def uploads_playlist_id(self):
        return self._uploads_playlist_id
    
    def to_dict(self):
        return {
            'channel_id': self._channel_id,
            'title': self._title,
            'description': self._description,
            'thumbnails': self._thumbnails,
            'uploads_playlist_id': self._uploads_playlist_id,
        }

    def __str__(self):
        s = ''
        s += f"channel_id:          {self._channel_id}\n"
        s += f"title:               {self._title}\n"
        s += f"description:         {self.description}\n"
        s += f"thumbnails:          {self._thumbnails}\n"
        s += f"uploads_playlist_id: {self._uploads_playlist_id}\n"
        return s

    
class PlayListItems:
    class Item:
        def __init__(self, video_id):
            self._video_id = video_id

        @property
        def video_id(self):
            return self._video_id
        
        def to_dict(self):
            return {
                'video_id': self._video_id,
            }
        
        def __str__(self):
            s = ''
            s += f"video_id: {self._video_id}\n"
            return s
              
    def __init__(self, playlist_id, youtube):
        self._playlist_id = playlist_id
        self._load(youtube)

    def _load(self, youtube):
            self._items = []
            next_page_token = None
            while True:
                response = youtube.playlistItems().list(
                    part='contentDetails',
                    playlistId=self._playlist_id,
                    maxResults=50,
                    pageToken=next_page_token
                ).execute()

                self._items += [
                    PlayListItems.Item(
                        item['contentDetails']['videoId'],
                    ) for item in response['items']
                ]

                if 'nextPageToken' in response:
                    next_page_token = response['nextPageToken']
                else:
                    break

    @property
    def items(self):
        return self._items
    
    def to_dict(self):
        return {
            'items': [item.to_dict() for item in self._items],
        }
    
    def __str__(self):
        s = ''
        for index, item in enumerate(self._items):
            s += f"items[{index}]:\n"
            s += str(item)
        return s

class Videos:
    class Video:
        def __init__(self, video_id, channel_id, published_at, title, description, thumbnails, duration, embed_html):
            self._video_id = video_id
            self._channel_id = channel_id
            self._published_at = published_at
            self._title = title
            self._description = description
            self._thumbnails = thumbnails
            self._duration = duration
            self._embed_html = embed_html

        @property
        def video_id(self):
            return self._video_id
        @property
        def channel_id(self):
            return self._channel_id
        @property
        def published_at(self):
            return self._published_at
        @property
        def title(self):
            return self._title
        @property
        def description(self):
            return self._description
        @property
        def thumbnails(self):
            return self._thumbnails
        @property
        def duration(self):
            return self._duration
        @property
        def embed_html(self):
            return self._embed_html
        
        def to_dict(self):
            return {
                'video_id': self._video_id,
                'channel_id': self._channel_id,
                'published_at': self._published_at,
                'title': self._title,
                'description': self._description,
                'thumbnails': self._thumbnails,
                'duration': self._duration,
                'embed_html': self._embed_html,
            }
        
        def __str__(self):
            s = ''
            s += f"video_id:     {self._video_id}\n"
            s += f"channel_id:   {self._channel_id}\n"
            s += f"published_at: {self._published_at}\n"
            s += f"title:        {self._title}\n"
            s += f"description:  {self.description}\n"
            s += f"thumbnails:   {self._thumbnails}\n"
            s += f"duration:     {self._duration}\n"
            s += f"embed_html:   {self._embed_html}\n"
            return s
  
    def __init__(self, video_ids, youtube):
        self._load(video_ids, youtube)

    def _load(self, video_ids, youtube):
        self._videos = []
        maxResults = 50

        while True:
            ids = video_ids[:maxResults]
            video_ids = video_ids[maxResults:]

            if len(ids) == 0:
                break
            
            response = youtube.videos().list(
                part='snippet,contentDetails,player',
                id=','.join(ids)
            ).execute()

            self._videos += [
                Videos.Video(
                    item['id'],
                    item['snippet']['channelId'],
                    item['snippet']['publishedAt'],
                    item['snippet']['title'],
                    item['snippet']['description'],
                    item['snippet']['thumbnails'],
                    item['contentDetails']['duration'],
                    item['player']['embedHtml'],
                ) for item in response['items']
            ]

    @property
    def videos(self):
        return self._videos
    
    def to_dict(self):
        return {
            'videos': [video.to_dict() for video in self._videos],
        }
    
    def __str__(self):
        s = ''
        for index, video in enumerate(self._videos):
            s += f"video[{index}]:\n"
            s += str(video)
        return s

def buildYoutubeApi(api_key):
    return build('youtube', 'v3', developerKey=api_key)

def main(youtube, channel_ids):
    all_videos = {}
    for channel_id in channel_ids:
        youtube_channel = YoutubeChannel(channel_id, youtube)
        playlist_items = PlayListItems(youtube_channel.uploads_playlist_id, youtube)
        videos = Videos([item.video_id for item in playlist_items.items], youtube)
        for video in videos.videos:
            all_videos[video.video_id] = video.to_dict()
    print(all_videos)

if __name__ == "__main__":
    load_dotenv()
    google_api_key = os.getenv('GOOGLE_API_KEY')

    parser = argparse.ArgumentParser()
    parser.add_argument('--google_api_key')
    parser.add_argument('--channel_ids', nargs='*', required=True)
    args = parser.parse_args()

    if args.google_api_key:
        google_api_key = args.google_api_key

    youtube = buildYoutubeApi(google_api_key)
    channel_ids = args.channel_ids

    main(youtube, channel_ids)

