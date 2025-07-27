import json

def main():
    with open('videos.json', 'r', encoding='utf-8') as f:
        videos = json.load(f)
    with open('tags.json', 'r', encoding='utf-8') as f:
        tags = json.load(f)
    
    untagged_video_ids = []
    for _, video in videos.items():
        if not video['video_id'] in tags:
            untagged_video_ids.append(video['video_id'])

    untags = {}
    for video_id in untagged_video_ids:
        untags[video_id] = {
                'video_id': video_id,
                'tags': [],
            }

    with open('untags.json', 'w', encoding='utf-8') as f:
        json.dump(untags, f, indent=2, ensure_ascii=False)  

if __name__ == "__main__":
    main()

