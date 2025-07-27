import os
import json

from dotenv import load_dotenv
from youtube import buildYoutubeApi, YoutubeChannel, PlayListItems, Videos

CHANNEL_IDS = (
    # 'UCR0V48DJyWbwEAdxLL5FjxA', # 日向坂46 OFFICIAL YouTube CHANNEL
    'UCOB24f8lQBCnVqPZXOkVpOg', # 日向坂ちゃんねる
)

def updateChannelsJson(youtube_channels):
    json_data = {channel.channel_id: channel.to_dict() for channel in youtube_channels}
    with open('channels.json', 'w', encoding='utf-8') as f:
        json.dump(json_data, f, indent=2, ensure_ascii=False)

def updateVideosJson(youtube_channels):
    json_data = {}
    for youtube_channel in youtube_channels:
        playlist_items = PlayListItems(youtube_channel.uploads_playlist_id, youtube)

        videos = Videos([item.video_id for item in playlist_items.items], youtube)
        for video in videos.videos:
            json_data[video.video_id] = video.to_dict()

    sorted_tuple = sorted(json_data.items(), key=lambda item: item[1]['published_at'], reverse=True)
    json_data = {key: value for key, value in sorted_tuple}
    with open('videos.json', 'w', encoding='utf-8') as f:
        json.dump(json_data, f, indent=2, ensure_ascii=False)

def main(youtube):
    youtube_channels = [YoutubeChannel(channel_id, youtube) for channel_id in CHANNEL_IDS]

    updateChannelsJson(youtube_channels)
    updateVideosJson(youtube_channels)

if __name__ == "__main__":
    load_dotenv()
    google_api_key = os.getenv('GOOGLE_API_KEY')
    youtube = buildYoutubeApi(google_api_key)

    main(youtube)

